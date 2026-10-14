# Developing Orion Quant Lab

1. Fetch `origin` and use the persistent `codex/orion-quant-rebrand` branch.
   Keep all ongoing lab work in its one open pull request; do not create additional
   feature branches or pull requests.
2. Check that pull request and choose one bounded item from `BACKLOG.md`; read
   `ARCHITECTURE.md` before changing numerical behavior.
3. Implement it and add meaningful regression tests when behavior changes.
4. Run `npm run check`. For interface changes, preview the actual page at narrow
   and wide widths and check keyboard access and reduced motion.
5. Update the backlog, changelog, and a learning note when useful.
6. Commit only relevant files and push to the persistent branch so the same pull
   request shows the update. Keep its title and description current. Leave merging
   to review.

## Publishing a reviewed release

After merging an Orion PR, update the full `revision` SHA in the portfolio's
`atlas-quant.lock.json` on a separate branch. In the portfolio run
`npm run sync:atlas`, then `npm run check`. Open and review that portfolio PR.
Merging it publishes the selected Orion code through the existing deployment.
The daily market-data workflow continues independently of daily development.

## Daily Codex task

A scheduled task in the portfolio Codex chat works in this independent checkout.
It should make one useful improvement, run checks, and push to the persistent
`codex/orion-quant-rebrand` branch. Keep a single review PR open and update it
instead of creating another branch or PR. After that PR is merged, recreate the
same branch from the new `origin/main` only if no unmerged work remains. It must
not buy services, use a paid fallback, merge PRs, or deploy without a new instruction.
Every run must report concrete changes and improvements, commit and PR when present,
checks and results, or say that no changes were made and why.

Local scheduled work requires the computer awake, Codex running, and GitHub access.
Future unattended runs remain subject to the app's permissions and usage limits.

HTML uses two-space indentation and a 100-column print width. Run
`npm run format:html` after editing markup; it uses pinned Prettier 3.6.2 on demand.
Keep the `quant lab` link in the main navigation on each page.
