# Repo cleanup checklist

These are the small, mechanical fixes from feedback #7. Each one is a 5-minute task. Knock them out before the architecture work lands so the repo is in good shape when reviewers (or grant committees) browse it.

## Typo fix
- [ ] In `README.md`, change `Portolio Overview` → `Portfolio overview`. (This typo is in your headline feature list and is the first thing reviewers see.)

## Move/delete one-off scripts
The following look like one-shot migration scripts and shouldn't sit in the repo root:

- [ ] `replace-colors.js` → move to `scripts/migrations/` or delete
- [ ] `replace-deep-space.js` → ditto
- [ ] `revert-dark-colors.js` → ditto
- [ ] `revert-light-colors.js` → ditto

If these were used to migrate the codebase to its current color tokens and aren't needed again, delete them. If they might be useful again, move them to `scripts/migrations/` with a top-of-file comment explaining when and why they were used.

## Tag a release
- [ ] Tag `v0.1.0`. Use the README's roadmap section as release notes. An empty Releases tab signals "abandoned project" to anyone scanning the repo for the first time.

```bash
git tag -a v0.1.0 -m "Initial public release"
git push origin v0.1.0
```

Then on GitHub, create a release from the tag and paste the roadmap "completed" items as the changelog.

## Add screenshots and a demo
- [ ] Replace `public/banner.png` (currently placeholder per README) with a real screenshot of the dashboard.
- [ ] Add a 30-second screen-recording GIF or MP4 to `/public/demo.gif` and embed in the README right after the title. Most decisions to click "Launch app" are made from the README image alone.

## Surface the Clarity contracts
The repo is `Clarity 1.7%` — there are smart contracts in `staxiq-contracts/` but the README doesn't mention what they do. Two scenarios:

- [ ] **If they enable real on-chain actions** (one-click rebalance, batch claim, on-chain strategy execution) — add a "Smart contracts" section to the README. This is a real differentiator vs. read-only aggregators.
- [ ] **If they're vestigial** — either delete the directory or build out the use case. Half-built contracts in a repo make people wonder what else is half-built.

## Add a CONTRIBUTING.md
Even if you're a solo dev for now, a short `CONTRIBUTING.md` (50 lines is fine) explaining how to add a new adapter is a strong signal that this is a serious project. Use the architecture section of the README as a starting point.

## Add a SECURITY.md
Standard one-pager: how to report a vulnerability, what's in scope, expected response time. GitHub will surface this in the "Security" tab and it's a checkbox grant reviewers look for.

## CI
- [ ] Add a GitHub Actions workflow that runs `npm run build` and any tests on every PR. Even a basic build check prevents the embarrassing case of a broken `main`.

## .env.example
- [ ] Add an `.env.example` with every variable the app reads, even if commented. Right now the README mentions environment variables but there's no template — that's a friction point for anyone trying to run it locally.

## package.json polish
- [ ] Set `"description"` to the same one-liner as the GitHub description.
- [ ] Set `"keywords"` to `["bitcoin", "stacks", "defi", "sbtc", "yield-aggregator", "portfolio"]` — these power npm/Google search.
- [ ] Set `"homepage"` to `https://staxiq.vercel.app`.
- [ ] Set `"bugs.url"` to the GitHub issues page.
- [ ] Set `"repository"` properly.
