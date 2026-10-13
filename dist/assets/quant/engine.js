export const VERSION = '1.0.0';
export function validateRows(rows) {
  if (!Array.isArray(rows) || rows.length < 3 || rows.length > 20000) throw new Error('Provide 3–20,000 daily observations.');
  rows.forEach((r, i) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !Number.isFinite(Date.parse(r.date)) || new Date(r.date).toISOString().slice(0,10) !== r.date || !Number.isFinite(r.close) || r.close <= 0) throw new Error(`Invalid date or positive price at row ${i + 1}.`);
    if (i && r.date <= rows[i-1].date) throw new Error('Dates must be unique and in ascending order.');
  });
  return rows;
}
export function parseCSV(text) {
  const lines = text.trim().replace(/^\uFEFF/, '').split(/\r?\n/);
  const headers = lines.shift().toLowerCase().split(',').map(s => s.trim());
  const date = headers.indexOf('date'), close = headers.indexOf('close');
  if (date < 0 || close < 0) throw new Error('CSV needs date,close columns, ISO dates, and decimal prices.');
  return validateRows(lines.map(line => { const cells = line.split(','); return {date: (cells[date] || '').trim(), close: Number(cells[close])}; }));
}
export function metrics(curve, capital) {
  let prev = capital, peak = capital, drawdown = 0;
  const returns = curve.map(p => { const r = p.equity / prev - 1; prev = p.equity; peak = Math.max(peak,p.equity); drawdown = Math.min(drawdown,p.equity/peak-1); return r; });
  const mean = returns.reduce((a,b)=>a+b,0)/returns.length;
  const variance = returns.reduce((s,r)=>s+(r-mean)**2,0)/(returns.length-1);
  const sd = Math.sqrt(variance);
  return {totalReturn:prev/capital-1, volatility:sd*Math.sqrt(252), sharpe:sd > 1e-12 ? mean/sd*Math.sqrt(252) : null, maxDrawdown:drawdown, finalValue:prev};
}
export function backtest(rows, config) {
  validateRows(rows);
  const {start,end,capital,lookback,feeBps,strategy} = config;
  if (!['momentum','hold'].includes(strategy) || !Number.isFinite(capital) || capital <= 0 || capital > 1e9 || !Number.isInteger(lookback) || lookback < 1 || lookback > 252 || !Number.isFinite(feeBps) || feeBps < 0 || feeBps > 100) throw new Error('Check capital, lookback (1–252), and costs (0–100 bps).');
  if (![start,end].every(d=>/^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0,10) === d) || start > end || start < rows[0].date || end > rows.at(-1).date) throw new Error('Choose a valid date range within this dataset.');
  const first = rows.findIndex(r=>r.date>=start), selected = rows.filter(r=>r.date>=start && r.date<=end);
  if (selected.length < 3) throw new Error('Choose at least three trading observations.');
  if (strategy === 'momentum' && first < lookback + 1) throw new Error(`Momentum needs ${lookback+1} observations before the start date. Choose a later start.`);
  function simulate(kind) {
    let cash = capital, shares = 0, costs = 0;
    const trades = [], curve = [], fee = feeBps / 10000;
    selected.forEach((r,j)=>{
      const i = first+j;
      const own = kind === 'hold' || rows[i-1].close > rows[i-1-lookback].close;
      if (own && !shares) {
        shares = cash / (r.close*(1+fee));
        const cost = shares*r.close*fee; costs += cost; cash = 0;
        trades.push({date:r.date,side:'BUY',price:r.close,shares,cost});
      } else if (!own && shares) {
        const cost = shares*r.close*fee; cash = shares*r.close-cost; costs += cost;
        trades.push({date:r.date,side:'SELL',price:r.close,shares,cost}); shares=0;
      }
      curve.push({date:r.date,equity:cash+shares*r.close,cash,shares});
    });
    return {curve,trades,costs,metrics:metrics(curve,capital)};
  }
  return {version:VERSION,config:{...config},strategy:simulate(strategy),benchmark:simulate('hold')};
}
