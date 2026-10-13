import {backtest, parseCSV, validateRows} from './engine.js';
const $ = s => document.querySelector(s), money = n => n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}), pct = n => `${(n*100).toFixed(2)}%`;
let bundled, data, current;
const key = 'atlas-experiments-v1';
const status = message => { $('#status').textContent=message; };
function setData(next) {
  data=next; current=null; $('#results').hidden=true; $('#empty').hidden=false;
  const rows=data.rows; const min=rows[0].date,max=rows.at(-1).date;
  for(const id of ['start','end']) { $(`#${id}`).min=min; $(`#${id}`).max=max; }
  $('#start').value=rows[Math.min(253,Math.max(0,rows.length-3))].date; $('#end').value=max;
  $('#data-note').textContent=`${data.ticker} · ${rows.length.toLocaleString()} observations · ${min} → ${max}. ${data.source}`;
  $('#run').disabled=false;
  showFreshness(data);
  status('Ready to test.');
}
function showFreshness(source) {
  const last=source.rows.at(-1).date;
  const stale=(Date.now()-Date.parse(last+'T23:59:59Z'))/86400000>5;
  const stamp=new Date(source.retrieved);
  const retrieved=Number.isNaN(stamp.getTime())?'unknown':stamp.toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
  $('#freshness').textContent=`Data through ${last}${stale?' · Data is over five days old':''}. Retrieved ${retrieved}.`;
  $('#freshness').classList.toggle('stale',stale);
}

function el(tag,text,className) {const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;}
function draw(result) {
  const svg=$('#chart'); svg.querySelectorAll('g').forEach(n=>n.remove());
  const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');svg.append(g);
  const a=result.strategy.curve,b=result.benchmark.curve,values=[result.config.capital,...a.map(p=>p.equity),...b.map(p=>p.equity)];
  let lo=Math.min(...values),hi=Math.max(...values); const pad=Math.max((hi-lo)*.1,hi*.01);lo-=pad;hi+=pad;
  const x=i=>65+i/(a.length-1)*710,y=v=>265-(v-lo)/(hi-lo)*235;
  function node(tag,attrs,text){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;g.append(n);}
  for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4;node('line',{x1:65,x2:775,y1:y(v),y2:y(v),class:'chart-grid'});node('text',{x:55,y:y(v)+4,'text-anchor':'end',class:'chart-label'},`${Math.round(v/1000)}k`);}
  for(const [series,cls] of [[b,'benchmark-line'],[a,'strategy-line']])node('path',{d:series.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(2)},${y(p.equity).toFixed(2)}`).join(' '),class:cls});
  node('text',{x:65,y:295,class:'chart-label'},a[0].date);node('text',{x:775,y:295,'text-anchor':'end',class:'chart-label'},a.at(-1).date);
}
function render(experiment) {
  current=experiment;const r=current.result,s=r.strategy.metrics,b=r.benchmark.metrics;
  $('#empty').hidden=true;$('#results').hidden=false;
  $('#result-title').textContent=`${current.data.ticker} / ${r.config.strategy==='hold'?'Buy and hold':'Momentum'}`;
  $('#range').textContent=`${r.strategy.curve[0].date} → ${r.strategy.curve.at(-1).date}`;
  $('#metrics').replaceChildren();
  const defs=[['Total return','totalReturn',pct,'Change in portfolio value after modeled costs.'],['Sharpe ratio','sharpe',v=>v===null?'N/A':v.toFixed(2),'Daily mean / daily sample deviation × √252; zero risk-free rate.'],['Max drawdown','maxDrawdown',pct,'Largest decline from a prior peak, including starting capital.'],['Volatility','volatility',pct,'Daily sample standard deviation × √252.']];
  for(const [label,key,format,help] of defs){const box=el('div','','metric');box.title=help;box.tabIndex=0;box.setAttribute('aria-label',`${label}: ${format(s[key])}. ${help}`);box.append(el('span',label),el('strong',format(s[key])),el('p',`B&H ${format(b[key])}`));$('#metrics').append(box);}
  draw(r);
  $('#interpretation').textContent=`Final value ${money(s.finalValue)} vs. ${money(b.finalValue)} for buy and hold. Strategy costs: ${money(r.strategy.costs)}. Difference: ${((s.totalReturn-b.totalReturn)*100).toFixed(2)} percentage points. This is an in-sample historical result.`;
  $('#trade-count').textContent=`${r.strategy.trades.length} executions`;
  $('#trades').replaceChildren();
  for(const t of r.strategy.trades){const tr=el('tr','');for(const v of [t.date,t.side,t.price.toFixed(2),t.shares.toFixed(4),t.cost.toFixed(2)])tr.append(el('td',v));$('#trades').append(tr);}
  if(!r.strategy.trades.length){const tr=el('tr','');const td=el('td','No trades. The strategy held cash throughout.');td.colSpan=5;tr.append(td);$('#trades').append(tr);}
}
$('#backtest-form').addEventListener('submit',event=>{
  event.preventDefault();try {
    if(!data)throw new Error('Load a dataset first.');
    const config={strategy:$('#strategy').value,start:$('#start').value,end:$('#end').value,capital:Number($('#capital').value),lookback:Number($('#lookback').value),feeBps:Number($('#fee').value)};
    const result=backtest(data.rows,config);
    render({id:crypto.randomUUID(),created:new Date().toISOString(),data:{...data,ticker:$('#dataset').value==='csv'?($('#ticker').value.trim()||'CUSTOM'):data.ticker},result});
    status('Backtest complete. Results reflect the settings at the time of this run.');
  }catch(error){status(error.message);}
});
$('#strategy').addEventListener('change',()=>{const hold=$('#strategy').value==='hold';$('#lookback').disabled=hold;$('#rule').textContent=hold?'Buy at the first selected close and hold through the final close.':'Own the asset when its prior closing price is above its close N sessions earlier. Otherwise, hold cash.';});
$('#dataset').addEventListener('change',()=>{
  const custom=$('#dataset').value==='csv';$('#import-fields').hidden=!custom;$('#check-data').hidden=custom;$('#freshness').textContent='';
  if(!custom && bundled)setData(bundled);else{data=null;current=null;$('#results').hidden=true;$('#empty').hidden=false;$('#run').disabled=true;$('#csv').value='';$('#data-note').textContent='Import a daily price series to begin.';status('Choose a CSV file.');}
});
$('#csv').addEventListener('change',async()=>{try{const f=$('#csv').files[0];if(!f)return;if(f.size>2000000)throw new Error('Choose a CSV smaller than 2 MB.');const rows=parseCSV(await f.text());setData({ticker:$('#ticker').value.trim()||'CUSTOM',source:`User CSV: ${f.name}`,retrieved:new Date().toISOString(),priceBasis:'User supplied; adjustment and daily frequency not independently verified.',rows});}catch(e){data=null;$('#run').disabled=true;status(e.message);}});
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type}));const a=el('a','');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#export').addEventListener('click',()=>{if(current)download(JSON.stringify(current,null,2),'application/json',`atlas-${current.id}.json`);});
$('#export-csv').addEventListener('click',()=>{if(!current)return;const r=current.result;const csv=['date,strategy_equity,benchmark_equity,cash,units',...r.strategy.curve.map((p,i)=>[p.date,p.equity,r.benchmark.curve[i].equity,p.cash,p.shares].join(','))].join('\n');download(csv,'text/csv',`atlas-equity-${current.id}.csv`);});
function saved(){const value=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(value))throw new Error('Invalid archive');return value.filter(e=>e?.id&&e?.result?.config&&e?.data?.rows);}
function archive(){try{const runs=saved();$('#saved').replaceChildren();if(!runs.length)$('#saved').append(el('p','No saved experiments yet. Run a backtest, then save it.','fine'));for(const e of runs){const row=el('div','','saved-row');row.append(el('span',`${e.data.ticker} · ${e.result.config.strategy} · ${e.result.config.start} → ${e.result.config.end}`));const open=el('button','Load run');open.addEventListener('click',()=>{try{render({...e,result:backtest(e.data.rows,e.result.config)});status('Saved run restored. Form settings apply to your next run.');$('#results').scrollIntoView({block:'start'});}catch(error){status(`Could not restore run: ${error.message}`);}});row.append(open);$('#saved').append(row);}}catch{$('#saved').textContent='Browser storage is unavailable or damaged. Use JSON export to retain your experiments.';}}
$('#save').addEventListener('click',()=>{if(!current)return;try{const runs=saved().filter(e=>e.id!==current.id);localStorage.setItem(key,JSON.stringify([current,...runs].slice(0,10)));archive();status('Experiment saved in this browser.');}catch{status('Could not save to browser storage. Export JSON to keep this experiment.');}});
async function loadPublishedData(initial = false) {
  const button=$('#check-data');button.disabled=true;
  try {
    const response=await fetch('/assets/quant/spy.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Dataset request failed');
    const next=await response.json();validateRows(next.rows);
    if(next.ticker!=='SPY')throw new Error('Unexpected dataset');
    const changed=JSON.stringify(bundled?.rows)!==JSON.stringify(next.rows);
    bundled=next;
    if($('#dataset').value==='spy') {
      if(initial || changed)setData(bundled);
      else {data=bundled;showFreshness(bundled);}
      if(!initial)status(changed?'Updated data loaded. Run a new backtest.':'You have the latest published dataset. New daily prices appear after the scheduled refresh.');
    }
  } catch {
    status(data?'Update check failed. Your loaded data and results are unchanged.':'Daily data could not load. Reload or import a CSV.');
  } finally {button.disabled=false;}
}
$('#check-data').addEventListener('click',()=>loadPublishedData());
await loadPublishedData(true);
archive();
