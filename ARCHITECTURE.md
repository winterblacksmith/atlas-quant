# Orion Quant Lab architecture

## First release

Orion Quant Lab lives at `/quant/`, with the research workspace at `/quant/lab/`.
The existing portfolio is a dependency-free static website served by Nginx.
This release keeps that deployment model: browser ES modules provide the interface,
a pure reusable JavaScript engine provides calculations, and a bundled SPY daily
adjusted-close snapshot provides historical data. CSV import accepts other daily
series; the benchmark always uses the same asset as the strategy.

This deliberately adapts the brief's suggested React/FastAPI/PostgreSQL stack to
the existing website. A server API and shared database are future work, not required
for this single-user research workflow. Experiments persist locally in the browser
and can be downloaded as self-contained JSON including input data and CSV results.
No trading connection is activated. A daily Codex task proposes bounded improvements through reviewed branches.

## Methodology

Signals use only closes available before execution. At close t, momentum uses
close[t-1] / close[t-1-lookback] > 1. Positions established at close t first earn
the return from t to t+1. Warmup observations precede the selected test window.
Buy-and-hold enters at the first test close. Both pay the same proportional fee
on each entry or exit. Fractional shares; long or cash only; cash earns zero;
no leverage, taxes, separate spread or slippage. Open positions are marked to
market at the last close, without forced liquidation. Adjusted prices model a
reinvested distribution series, not actual historical share counts or fills.

Return = final equity / initial capital - 1. Daily returns include the initial
entry fee. Annualized volatility uses sample standard deviation × sqrt(252).
Sharpe uses arithmetic daily mean / sample deviation × sqrt(252), zero risk-free
rate; undefined when deviation is zero. Drawdown includes starting capital as
an initial high-water mark. Annualization assumes daily trading observations;
import validation cannot independently verify a provider's trading calendar.

## Reproducibility and boundaries

Each saved run records engine version, config,
source metadata, all input rows, results and timestamp. Exports survive browser
storage clearing. Local storage is limited to the latest 10 experiments. There
is no account, cloud sync, live quote feed, or claim of predictive performance.

## Daily data refresh

`scripts/refresh-market-data.py` calls the Yahoo Finance chart endpoint from the
build runner. It refreshes the complete adjusted history, rather than appending
new prices to a history with a different dividend-adjustment basis. The endpoint
requires no key in this implementation, but is unofficial and has no availability
contract; HTTP errors, throttling or schema changes fail the refresh visibly.

The deployment workflow runs weekdays at 23:30 UTC and also refreshes on production
push/manual deployments. GitHub schedules become active only on the default branch;
the job additionally requires `main`. No production deployment runs on the feature
branch. Prices dated today are excluded until 18:00 America/New_York, allowing a
buffer after the regular close. Holidays/weekends add no rows. Validation checks
symbol, ordering, finite positive prices, full history, previously known dates,
and a maximum five-calendar-day lag. This is a freshness heuristic, not a complete
exchange holiday calendar. Failed refreshes abort before publishing.

The runner atomically replaces its local dataset, runs checks, and copies it into
the release package. It does not commit generated prices or require repository
write permission. Release IDs are 40 hexadecimal characters from the package hash
so new data gets its own release even when the source commit is unchanged. This
uses the existing deployment helper's accepted ID format and keeps rollback releases.

The frontend fetches same-origin JSON with no-store and provides an explicit update
check. That button checks the published snapshot; it does not contact Yahoo or start
a deployment. Experiments retain their original input rows and metadata. The data
includes a SHA-256 of the price rows, retrieval timestamp, and latest session date.
GitHub Actions run logs report refresh failures. Scheduled workflows can be delayed
or disabled by GitHub; the UI flags data more than five days old.

## Independent repository and deployment

Orion Quant Lab is maintained in `winterblacksmith/atlas-quant`. Its static output is
`dist/quant/`, `dist/assets/quant/`, and `dist/assets/atlas-shell/`. The shell is a
small independent copy of the portfolio's navigation, themes, and styles; Orion Quant Lab
owns this copy so a release can be previewed and tested without the portfolio.
The repository slug and `atlas-*` integration paths remain stable for existing links
and scheduled release workflows; Orion Quant Lab is the public product name.
Portfolio links are absolute; all Orion Quant Lab runtime dependencies are local.

The portfolio stores a full commit SHA in `atlas-quant.lock.json`, checks out
that exact Orion revision, runs its checks and data refresh, and assembles those
three directories into its release. Orion code changes go live only when
the portfolio pin is updated and deployed. Weekday data refresh continues through
the portfolio workflow at 23:30 UTC, using the pinned Orion refresh script.
No deployment secrets are copied into this repository. Pull requests use read-only
CI permissions. The Codex daily task pushes feature branches and opens PRs; it does
not merge or change the production pin automatically.
