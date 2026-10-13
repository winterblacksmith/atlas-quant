# Atlas working agreements

- This is a standalone static research lab. Keep it dependency-light and free of
  new paid services. Preserve `/quant/` and `/quant/lab/` URLs.
- Read ARCHITECTURE.md for timing, adjusted-price assumptions, and metric definitions.
- Start changes on a `codex/` branch from current `origin/main`. Never overwrite
  unrelated local work or force-push another branch.
- Run `npm run check` before committing. Test mathematical behavior independently,
  especially signal timing, fees, imported data, and lookahead prevention.
- Use textContent for user-provided content. Keep import size/format validation.
- Check the existing backlog and open PRs. Prefer one meaningful, bounded change
  per PR. Update BACKLOG.md and CHANGELOG.md to reflect what actually changed.
- Daily automation may commit and push passing changes and open a PR. It must not
  merge, alter the portfolio's release pin, or deploy automatically.
- Keep secrets out of files and output. No paid provider fallback or new services.
- Do not mutate generated price snapshots just to produce daily commits.
