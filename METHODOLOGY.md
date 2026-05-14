# Staxiq Methodology

This document is the single source of truth for how Staxiq fetches, computes, and presents data. It is versioned with the codebase, linked from the live app, and updated every time the calculations change.

If a number on Staxiq disagrees with what you see on a protocol's own dashboard, this document tells you why.

## Principles

1. **Show the source.** Every APY, TVL, and balance carries a link to where it came from and an `asOf` timestamp.
2. **Cross-validate when possible.** TVLs are checked against DefiLlama. Drift is surfaced in `/api/health` and labelled in the UI.
3. **Cache deliberately, never opaquely.** TTLs are documented. A stale number is labelled stale.
4. **Partial data beats no data.** When one protocol is degraded, we show the rest and flag the failure — we don't blank the whole dashboard.
5. **Numbers are decimals, internally.** `0.0421`, not `4.21%`. Display formatting is the UI's job.

## Data sources

| Protocol | Live data | TVL cross-check | Notes |
|---|---|---|---|
| Zest Protocol | Zest public API | DefiLlama (`zest-protocol`) | Lending market; supply + borrow APYs |
| Native PoX Stacking | Hiro Stacks API (`/v2/pox`, `/v2/pox_address`) | None — protocol is its own reference | APY computed from trailing 12-cycle reward history |
| Granite | _coming in wave 2_ | DefiLlama | |
| StackingDAO | _coming in wave 2_ | DefiLlama | Liquid stacking; stSTX |
| Bitflow | _coming in wave 2_ | DefiLlama | DEX/AMM pools |
| Alex | _coming in wave 2_ | DefiLlama | |
| Hermetica | _coming in wave 2_ | — | USDh stablecoin yield |
| Velar | _coming in wave 2_ | DefiLlama | |

## How APYs are computed

Where a protocol publishes its own APY (Zest, Granite, StackingDAO, Bitflow, Alex), we use it directly and link to the source page.

For native PoX Stacking, we compute an *indicative* APY from the trailing 12 cycles of on-chain reward data:

    indicative_apy = (sum_btc_rewards_usd_12_cycles / mean_stx_locked_usd) × (26 cycles per year / 12)

We label this clearly as "indicative" because past cycles are not a guarantee of future ones.

## How USD values are computed

USD values are derived from a price oracle (price source documented in `/server/portfolio/prices.js`). Stablecoins use $1 unless they're depegged, in which case we surface the depeg explicitly.

## Cache TTLs

| Data type | TTL | Rationale |
|---|---|---|
| Yields | 60s | APYs move minute-to-minute on busy markets |
| TVL | 5min | Slow-moving, but daily snapshots are not enough |
| User positions | 20s | Near-real-time, with burst absorption |
| DefiLlama | 10min | Their own cache is already long |

A response served from cache shows its `asOf` timestamp in the response headers. The UI surfaces this on hover.

## Cross-validation

For every protocol with a `defillamaSlug`, the `/api/health` endpoint compares our computed TVL to DefiLlama's:

- **Drift < 5%** → confidence `ok`. Green dot.
- **Drift 5–20%** → confidence `warn`. Yellow dot, drift shown in the UI.
- **Drift > 20%** → confidence `fail`. Red dot, protocol marked DEGRADED in the UI, and the report is logged for engineering review.

We choose to surface this publicly because hidden disagreement is worse than admitted disagreement.

## Wallet Health Score

See [`HEALTH_SCORE.md`](./HEALTH_SCORE.md) for the full rubric. Every rule is open-source, every rule's effect on a given portfolio is shown in the UI, and the rubric is versioned (current: `0.1.0`).

## AI Copilot

See [`AI_COPILOT.md`](./AI_COPILOT.md) (forthcoming). Summary:

- The Copilot only sees structured portfolio data and detected insights — never raw protocol prose.
- Every recommendation must reference a specific fact id from the input. The post-processor drops any recommendation it can't ground.
- The Copilot does not produce price predictions, dollar amounts, or transaction parameters. It recommends action shapes; the user executes manually.

## Reporting an issue

If a number on Staxiq looks wrong, open an issue with:
- The protocol and asset
- The page URL
- The number you saw
- The number you expected and where you saw it

We aim to triage within 24 hours.
