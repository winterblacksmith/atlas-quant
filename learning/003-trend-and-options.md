# A second trend definition, and a different kind of model

## Research question

Time-series momentum asks whether the previous close exceeds the close `N`
sessions earlier. A moving-average filter asks whether that same previous close
exceeds the average of the previous `N` closes. Both are precise, testable
definitions of a trend. Neither is assumed to outperform buy and hold.

The filter uses only information through yesterday and trades at today's close.
An equal close and average means cash. Both strategies use the same asset,
period, capital, and transaction-cost rule as their buy-and-hold benchmark.
Hand-calculated tests cover warmup, equality, execution timing, fees, and a
future-price change that must not alter an earlier decision.

On the bundled SPY snapshot through October 1, 2026 (dataset SHA-256
`dc7269f8df222aa453b183b0f6fae0815cc3069e9278b44c8d0a86db8d6c5c60`),
the 30-session filter run from January 4, 2021 with $100,000 and 5 bps per trade
returned 37.32%, compared with 123.55% for buy and hold. Maximum drawdown was
17.29% versus 24.50%; the filter made 134 trades and incurred $7,768 in modeled
costs. Its lower drawdown does not compensate for the much lower return on this
sample. The result is in-sample and changes if the dataset or settings change.

## Why options pricing lives elsewhere

Black–Scholes–Merton answers a different question: given spot, strike, time,
rate, dividend yield, and volatility, what is a theoretical European option
value? The module reports call and put values plus local sensitivities. Its
default `S = K = 100`, `T = 1`, `r = 5%`, `q = 0`, `σ = 20%` example yields
approximately $10.45 for a call and $5.57 for a put. These are model outputs
from hypothetical inputs, not observed option prices or trading returns.

Tests check those benchmark values, put–call parity, spot monotonicity, finite-
difference Greeks, and limiting cases. This validates implementation behavior,
not the model's ability to describe market prices. Actual historical options
research would need point-in-time contracts and executable quotes.

## What remains unknown

The backtester still lacks an untouched out-of-sample period and a separate
slippage model. Comparing many lookbacks on the same sample risks overfitting.
The options calculator assumes European exercise, constant volatility and rates,
and frictionless trading. The next research step is stronger validation, not a
claim of profitable trading.
