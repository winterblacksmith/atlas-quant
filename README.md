# Atlas Quant

A small, transparent research lab for asking how a trading rule behaved in the past.
Start with the museum-style field guide, then run a browser-based experiment using
SPY daily adjusted prices or your own CSV.

**[Take the tour](https://shishirlohar.com/quant/) · [Enter the lab](https://shishirlohar.com/quant/lab/)**

## What you can investigate

- Compare time-series momentum with buy and hold on the same history.
- Change dates, lookback, starting capital, and transaction costs.
- Inspect daily equity, drawdown, volatility, Sharpe ratio, and individual trades.
- Save experiments locally and export full experiment JSON or daily equity CSV.
- Import a different daily series with `date,close` columns.

This is a historical simulation with imaginary money. There is no brokerage
connection or real trading. Signals use prior closes and execute at the next close;
the tests cover timing, fees, validation, and metric calculations.

## Run locally

Requires Node.js 18+ and Python 3.9+; there are no packages to install.

```sh
npm run check
npm run dev
```

Open http://127.0.0.1:4174/quant/. Calculations and saved experiments stay in the
browser. The included data is a snapshot; read its dates in the lab before use.

```sh
npm run refresh:data
npm run check
```

The refresh uses Yahoo Finance's unofficial chart endpoint with no API key,
subscription, or paid fallback. It rejects incomplete sessions and invalid data.
Failure preserves the last local snapshot. Production refreshes on the portfolio's
weekday schedule, so the repository snapshot may be older than the live website.

## Code map

| Path | Purpose |
| --- | --- |
| `dist/quant/` | Field guide and research workspace |
| `dist/assets/quant/engine.js` | Pure backtest and metric functions |
| `dist/assets/quant/lab.js` | Inputs, charts, imports, exports, local saves |
| `dist/assets/atlas-shell/` | Independent navigation, theme, and base styles |
| `scripts/refresh-market-data.py` | Validated daily adjusted-price refresh |
| `tests/` | Engine and refresh regression tests |
| `learning/` | Short notes explaining research decisions |

See [architecture and assumptions](ARCHITECTURE.md), [backlog](BACKLOG.md),
[development workflow](CONTRIBUTING.md), and [release history](CHANGELOG.md).

## Connected to the portfolio

This repository owns Atlas. The [portfolio](https://github.com/winterblacksmith/shishirlohar.com)
includes a tested, pinned commit in its existing deployment. Visitors still use
`shishirlohar.com/quant/`; the portfolio's Projects page links to both this repo
and the live lab. Updating Atlas's `main` does not by itself publish a new release.

Initial code was extracted from the portfolio on 2026-10-13, preserving attribution
and methodology. The earlier implementation history remains in the portfolio repo.
Standard public-repository CI and the existing web server are used; no additional
hosting account, paid data provider, or deployment credential is needed here.
