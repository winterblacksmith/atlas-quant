// Black–Scholes–Merton values for European options with continuous dividend yield.
// Rates and volatility are decimals (0.05 means 5%); time is measured in years.
const SQRT_TWO_PI = Math.sqrt(2 * Math.PI);

function normalPDF(x) {
  return Math.exp(-x * x / 2) / SQRT_TWO_PI;
}

// Abramowitz and Stegun 26.2.17; maximum absolute CDF error about 7.5e-8.
function normalCDF(x) {
  const absolute = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * absolute);
  const tail = normalPDF(absolute) * t *
    (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - tail : tail;
}

export function priceEuropeanOptions({spot, strike, years, rate, dividendYield, volatility}) {
  const numbers = [spot, strike, years, rate, dividendYield, volatility];
  if (numbers.some(value => !Number.isFinite(value)) || spot <= 0 || strike <= 0 || years <= 0 || years > 100 || volatility <= 0 || volatility > 10) {
    throw new Error('Enter positive spot, strike, time, and volatility. Rates and yields must be finite.');
  }
  const rootTime = Math.sqrt(years);
  const discountStock = Math.exp(-dividendYield * years);
  const discountStrike = Math.exp(-rate * years);
  const d1 = (Math.log(spot / strike) + (rate - dividendYield + volatility * volatility / 2) * years) / (volatility * rootTime);
  const d2 = d1 - volatility * rootTime;
  const nd1 = normalCDF(d1), nd2 = normalCDF(d2);
  const density = normalPDF(d1);
  const gamma = discountStock * density / (spot * volatility * rootTime);
  const vega = spot * discountStock * density * rootTime;
  const commonTheta = -spot * discountStock * density * volatility / (2 * rootTime);
  const call = {
    price: spot * discountStock * nd1 - strike * discountStrike * nd2,
    delta: discountStock * nd1,
    gamma,
    vega,
    theta: commonTheta - rate * strike * discountStrike * nd2 + dividendYield * spot * discountStock * nd1,
    rho: strike * years * discountStrike * nd2
  };
  const put = {
    price: strike * discountStrike * normalCDF(-d2) - spot * discountStock * normalCDF(-d1),
    delta: discountStock * (nd1 - 1),
    gamma,
    vega,
    theta: commonTheta + rate * strike * discountStrike * normalCDF(-d2) - dividendYield * spot * discountStock * normalCDF(-d1),
    rho: -strike * years * discountStrike * normalCDF(-d2)
  };
  // Far-out-of-the-money subtraction can round a nonnegative price just below zero.
  call.price = Math.max(0, call.price);
  put.price = Math.max(0, put.price);
  if (Object.values(call).concat(Object.values(put)).some(value => !Number.isFinite(value))) {
    throw new Error('These inputs produce values outside the calculator’s numeric range.');
  }
  return {call, put, d1, d2, parityGap: call.price - put.price - (spot * discountStock - strike * discountStrike)};
}
