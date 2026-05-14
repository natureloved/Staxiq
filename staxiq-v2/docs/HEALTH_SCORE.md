# Wallet Health Score

The Wallet Health Score is a 0–100 rating of how exposed a Stacks DeFi portfolio is to common failure modes (liquidation, single-protocol concentration, smart-contract risk).

It is **explicitly not** a prediction of returns. A high score means "this portfolio is structured to survive bad days," not "this portfolio will make money."

## Why open-source the rubric?

DeFi has a long history of opaque scores being wrong, gameable, or both. We publish ours so:
- Users can see exactly which inputs hurt or helped their score.
- Reviewers (auditors, grant committees, institutional partners) can verify the methodology.
- Researchers can fork it.

The rubric is versioned (current: **0.1.0**). When we change it, the version bumps and historical scores remain reproducible.

## Rules (rubric v0.1.0)

A wallet starts at **100**. Each rule applies a signed delta. The final score is clamped to [0, 100].

### `concentration` — max ±20

Penalises portfolios where >50% of position value sits in a single protocol.

| Top-protocol share | Delta |
|---|---|
| > 90% | -20 |
| 70–90% | -12 |
| 50–70% | -6 |
| ≤ 50% | 0 |

**Why:** A single smart-contract failure in any one protocol shouldn't be able to wipe out the user. Diversification across at least two protocols is a basic defence-in-depth measure.

### `liquidation-buffer` — max ±25

Looks at every borrow position's health factor (HF). Penalises the lowest one.

| Lowest HF | Delta |
|---|---|
| < 1.2 | -25 |
| 1.2 – 1.5 | -15 |
| 1.5 – 2.0 | -8 |
| ≥ 2.0 | 0 |

**Why:** sBTC's price volatility means an HF of 1.2 can cross the liquidation threshold during a single 10–15% downward move. 2.0× is the conservative buffer recommended by most lending market documentation.

### `idle-capital` — max ±10

Soft penalty for having a large share of holdings in the wallet earning 0%.

| Idle share | Delta |
|---|---|
| > 80% | -10 |
| 50–80% | -5 |
| 30–50% | -2 |
| ≤ 30% | 0 |

**Why:** Idle capital is a missed opportunity, not a hazard — so it's capped relatively low. We don't want this rule to dominate the score for a user who simply prefers to hold.

### `asset-diversity` — max +5 (positive only)

Awards points for holding meaningful balances of multiple distinct asset types: BTC (sBTC/BTC), STX (STX/stSTX), and stablecoins.

| Distinct asset types | Delta |
|---|---|
| 3 of 3 | +5 |
| 2 of 3 | +2 |
| 1 of 3 | 0 |

**Why:** An all-sBTC portfolio rises and falls with one asset. Holding meaningful stablecoin reserves alongside reduces single-asset blow-up risk.

### `protocol-risk` — max ±15

Penalises capital deployed in protocols flagged with `smartContract: 'high'` in our integrations registry. The flag is set conservatively for very new, unaudited, or structurally novel protocols.

| Share in high-risk protocols | Delta |
|---|---|
| > 50% | -15 |
| 25–50% | -8 |
| 10–25% | -3 |
| ≤ 10% | 0 |

**Why:** New protocols have most of their tail risk in front of them. Capital in well-audited, multi-year-old protocols should not be treated the same as capital in a freshly-deployed contract.

## What this score does NOT consider

- Tax efficiency
- Off-chain holdings
- The user's personal risk tolerance, time horizon, or income
- Yield expectations

We deliberately keep the rubric narrow. A score of 90 is not financial advice; it is a structural assessment.

## Reproducibility

The score for any wallet is fully reproducible from the rubric and the public on-chain state. The full algorithm is in [`server/healthScore/rubric.js`](../server/healthScore/rubric.js) and [`server/healthScore/score.js`](../server/healthScore/score.js).

## Version history

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-05 | Initial public rubric |
