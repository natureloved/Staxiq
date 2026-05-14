# Patch: fix `asset-diversity` rule to count positions

The `asset-diversity` rule in `server/healthScore/rubric.js` (shipped in Wave 1) currently only inspects `snap.balances` to decide whether the user holds BTC, STX, and stablecoins. That's incorrect: a user with all of their sBTC supplied to Zest still has BTC asset-class exposure — the sBTC is in a position, not the wallet.

This patch extends the rule to consider positions too, and bumps the rubric version from 0.1.0 to 0.1.1. The change is conservative (it only adds positive points, never penalises), so existing scores can only stay the same or go up.

## Step 1 — Bump the rubric version

In `server/healthScore/rubric.js`, change:

```js
export const RUBRIC_VERSION = '0.1.0';
```

to:

```js
export const RUBRIC_VERSION = '0.1.1';
```

## Step 2 — Update the rule

Find the `assetDiversityRule` definition. Replace the `apply` function with this version (the rest of the rule object — `id`, `title`, `description`, `maxAbsDelta` — stays the same):

```js
apply(snap) {
  // Look at meaningful holdings from BOTH wallet balances AND positions.
  // A user whose sBTC is supplied to Zest still has BTC asset-class
  // exposure; the sBTC just isn't in their wallet at the moment.
  const meaningful = [];
  for (const b of snap.balances) {
    if (Number(b.usdValue) >= 50) meaningful.push(b.symbol);
  }
  for (const p of snap.positions) {
    if (Number(p.principal.usdValue) >= 50) meaningful.push(p.principal.symbol);
  }
  const symbols = new Set(meaningful.map((s) => s.toUpperCase()));
  let delta = 0;
  const hasBtc = symbols.has('SBTC') || symbols.has('BTC');
  const hasStx = symbols.has('STX') || symbols.has('STSTX');
  const hasStable = ['USDH', 'USDC', 'USDCX', 'USDA', 'USDT', 'AEUSDC'].some((s) => symbols.has(s));
  const types = [hasBtc, hasStx, hasStable].filter(Boolean).length;
  if (types >= 3) delta = +5;
  else if (types === 2) delta = +2;
  return {
    ruleId: this.id,
    title: this.title,
    delta,
    maxAbsDelta: this.maxAbsDelta,
    evidence: {
      message: `Holds ${types} of 3 asset types (BTC / STX / stablecoin) across wallet and positions.`,
      meta: { hasBtc, hasStx, hasStable },
    },
  };
},
```

Two real changes from the original:

1. **Sources** — the `meaningful` set is now built from both `snap.balances` AND `snap.positions[].principal`.
2. **Stablecoin coverage** — added `'AEUSDC'` to the recognised stablecoin symbols (Granite's primary stablecoin; was missing in 0.1.0).

The evidence message is also slightly clearer about what's being counted.

## Step 3 — Update the methodology doc

In `docs/HEALTH_SCORE.md`, append to the "Version history" table:

```
| 0.1.1 | 2026-05 | `asset-diversity` rule now counts positions, not just wallet balances. Added aeUSDC to stablecoin symbols. |
```

And in the rule description for `asset-diversity`, change:

```
> Awards up to +5 for holding meaningful balances of multiple distinct asset types
```

to:

```
> Awards up to +5 for holding meaningful exposure to multiple distinct asset types — across both the wallet and any active positions. A user whose sBTC is supplied to Zest still has BTC asset-class exposure.
```

## Step 4 — Verify

Run a quick test: a wallet with sBTC supplied to Zest, STX stacked, and aeUSDC in the wallet should now score +5 on asset-diversity. Before this patch it would have scored +2 (only the wallet's aeUSDC counted).

## Why this matters

The rule existed to surface single-asset concentration risk. The original implementation undercounted diversification because it ignored where the assets actually live. The fix is small, but it's the kind of correctness issue that, left in place, makes the score look arbitrary to users who notice ("why does Zapper say I'm diversified but Staxiq says I'm not?"). The whole pitch of the transparent rubric is that users can audit it; an auditable rule that's also wrong would have been worse than no rule at all.
