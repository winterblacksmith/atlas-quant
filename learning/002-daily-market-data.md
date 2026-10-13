# A daily bar is not a live quote

A daily bar can change while the market is open. The data refresh waits until
6 p.m. New York time before accepting today's observation, then the production
schedule publishes at 23:30 UTC. Backtests therefore use completed sessions.

Adjusted prices can also change after dividends and splits. Refreshing the entire
history keeps all observations on the same adjustment basis. Saved experiments
retain their own rows and a dataset hash, so a later refresh does not change the
historical evidence behind an earlier experiment.

The refresh checks data before replacing the previous snapshot. Network or provider
failures stop publishing; a visible data date makes staleness apparent. The provider
endpoint is unofficial and the five-day freshness limit is a heuristic, not an
exchange calendar. See `scripts/refresh-market-data.py` and its tests.

Question: Why would combining last month's adjusted history with newly adjusted
prices create a return that never actually happened?
