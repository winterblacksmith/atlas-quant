# Orion Quant Lab working agreements

- This is a standalone static research lab. Keep it dependency-light and free of
  new paid services. Preserve `/quant/` and `/quant/lab/` URLs.
- Read ARCHITECTURE.md for timing, adjusted-price assumptions, and metric definitions.
  Before strategy work, read STRATEGY_ROADMAP.md and follow its priority and readiness
  checks.
- Keep development on the persistent `codex/orion-quant-rebrand` branch and its
  single open pull request. Never create a date-specific branch or overwrite
  unrelated local work.
- Run `npm run check` before committing. Test mathematical behavior independently,
  especially signal timing, fees, imported data, and lookahead prevention.
- Use textContent for user-provided content. Keep import size/format validation.
- Check the existing backlog and open PRs. Add one meaningful, bounded change to
  the persistent pull request. Update BACKLOG.md and CHANGELOG.md to reflect what
  actually changed.
- Daily automation may commit and push passing changes and open a PR. It must not
  merge, alter the portfolio's release pin, or deploy automatically.
- Keep secrets out of files and output. No paid provider fallback or new services.
- Do not mutate generated price snapshots just to produce daily commits.
