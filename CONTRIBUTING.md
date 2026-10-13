# Developing Atlas

1. Fetch `origin` and start `codex/<short-description>` from `origin/main`.
2. Check open pull requests to avoid duplicate work. Choose one bounded item from
   `BACKLOG.md`; read `ARCHITECTURE.md` before changing numerical behavior.
3. Implement it and add meaningful regression tests when behavior changes.
4. Run `npm run check`. For interface changes, preview the actual page at narrow
   and wide widths and check keyboard access and reduced motion.
5. Update the backlog, changelog, and a learning note when useful.
6. Commit only relevant files, push the feature branch, and open a pull request
   describing the change, validation, and limits. Leave merging to review.

## Publishing a reviewed release

After merging an Atlas PR, update the full `revision` SHA in the portfolio's
`atlas-quant.lock.json` on a separate branch. In the portfolio run
`npm run sync:atlas`, then `npm run check`. Open and review that portfolio PR.
Merging it publishes the selected Atlas code through the existing deployment.
The daily market-data workflow continues independently of daily development.

## Daily Codex task

A scheduled task in the portfolio Codex chat works in this independent checkout.
It should make one useful improvement, run checks, and push a reviewable PR.
It should check previous open PRs first, avoid overlapping work, and skip empty
commits when no bounded improvement is ready. It must not buy services, use a paid
fallback, merge PRs, or deploy without a new instruction. Notify on a completed PR,
a failure, or a decision that needs the owner; stay quiet for unchanged conditions.

Local scheduled work requires the computer awake, Codex running, and GitHub access.
The initial migration and first feature branch exercise the same check/commit/push
path; future unattended runs remain subject to the app's permissions and usage limits.

HTML uses two-space indentation and a 100-column print width. Run
`npm run format:html` after editing markup; it uses pinned Prettier 3.6.2 on demand.
Keep the `quant lab` link in the main navigation on each page.
