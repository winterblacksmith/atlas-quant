# Backtesting without looking ahead

## What changed?
The first Atlas Quant lab tests buy-and-hold and time-series momentum against
historical SPY adjusted prices, with the same costs and capital.

## What does this mean?
A backtest simulates decisions using only information available at the time.
Momentum owns the asset when its previous close exceeds its close N sessions earlier.

## Simple example
Monday closes at 100 and Tuesday at 110. With a one-session lookback, that rise
can generate Wednesday's purchase. The simulator buys at Wednesday's close;
it cannot earn Tuesday's or Wednesday's earlier price increase from that purchase.

## Why do quants care?
Using information before it was available creates false profits. A benchmark
also helps separate the strategy's contribution from a broadly rising market.

## Where is it implemented?
`dist/assets/quant/engine.js`, with hand-calculated cases in `tests/quant.test.mjs`.

## Limitations
Adjusted closes are a research approximation. Cash earns zero; prices have no
modeled slippage; no out-of-sample validation is performed. Selecting the best
lookback after inspecting results can overfit the historical period.

## A question for Shishir
Would you prefer the highest historical return or a lower return with smaller
drawdowns? What new evidence would make that comparison more convincing?
