# Patch: wire `buildSnapshot` into the read-only route

Currently in `server/routes/readonly.js` the research-mode handler builds a stub snapshot:

```js
const snap = {
  address,
  totalUsd: '0',
  balances: [],
  positions: positions.ok,
};
```

That's why the health score is being computed against an empty wallet — the rubric sees `totalUsd: '0'` and the idle-capital insight has nothing to detect against. This patch swaps the stub for the real snapshot builder.

## Step 1 — Add the import

At the top of `server/routes/readonly.js`, alongside the other imports, add:

```js
import { buildSnapshot } from '../portfolio/snapshot.js';
```

## Step 2 — Replace the stub

Find this block in the `/api/research/:address` handler:

```js
const positions = await fanOut((a) => a.fetchUserPositions(ctx, address));

// Build a portfolio snapshot. Wallet balances should come from a
// dedicated balance fetcher; here we leave a stub so the score still
// computes when balances are unavailable.
/** @type {import('../healthScore/rubric.js').PortfolioSnapshot} */
const snap = {
  address,
  totalUsd: '0', // populate from balance fetcher in production
  balances: [],  // ditto
  positions: positions.ok,
};

const health = computeHealthScore(snap);
res.json({
  address,
  positions: positions.ok,
  degraded: positions.errors,
  health,
});
```

Replace it with:

```js
const positions = await fanOut((a) => a.fetchUserPositions(ctx, address));

// Real snapshot — balances from Hiro, USD values from the price oracle,
// USD backfilled on positions where adapters didn't supply them.
const snap = await buildSnapshot(ctx, address, positions.ok);

const health = computeHealthScore(snap);
res.json({
  address,
  totalUsd: snap.totalUsd,
  balances: snap.balances,
  positions: snap.positions,    // these are the priced versions now
  degraded: positions.errors,
  health,
});
```

The response shape is a strict superset of what was there before — existing UI code keeps working, and the new `totalUsd` / `balances` fields become available for the research-mode page header.

## Step 3 — (Optional) UI: surface the totalUsd

In `src/pages/ResearchMode.jsx`, add a small portfolio-total line above the HealthScoreCard. Find:

```jsx
{data && (
  <div className="space-y-10">
    <HealthScoreCard health={data.health} />
```

Change the wrapper to:

```jsx
{data && (
  <div className="space-y-10">
    <div className="border border-zinc-900 px-4 py-6">
      <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-1">
        Total portfolio
      </p>
      <p className="text-4xl font-semibold tabular-nums text-zinc-50">
        ${Number(data.totalUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-zinc-500 text-sm mt-1">
        {data.balances.length} wallet asset{data.balances.length === 1 ? '' : 's'} ·{' '}
        {data.positions.length} active position{data.positions.length === 1 ? '' : 's'}
      </p>
    </div>

    <HealthScoreCard health={data.health} />
```

Five lines, no new imports, matches the existing aesthetic.

## Step 4 — Verify

Restart the server, then:

```bash
# Pick any active Stacks address — yours, a friend's, or a known whale.
ADDR="SP2J6ZY48GV1EZ5V2V5RB9MP66SW86BZWN0FZ7SE5"  # example, replace

curl "http://localhost:3002/api/research/$ADDR" | jq '{
  totalUsd,
  balanceCount: (.balances | length),
  positionCount: (.positions | length),
  health: { score: .health.score, highlights: .health.highlights }
}'
```

Expected: a non-zero `totalUsd` for any active address, real `balanceCount` and `positionCount`, and a `score` that reflects the actual portfolio (not 100 by default).

If `totalUsd` is still 0:

1. **Balances endpoint failing** — check server logs for `snapshot: fetchBalances failed`. Most common cause is hitting Hiro mainnet API while `STACKS_NETWORK=testnet` is set in `.env`.
2. **Prices endpoint failing** — check logs for `prices: coingecko fetch failed`. CoinGecko's free tier has rate limits; if you're hitting them, set `COINGECKO_BASE` to a Pro endpoint or another provider with the same shape.
3. **Token contract IDs wrong** — check logs for `balances: unknown SIP-010 token (skipped)`. Each unknown contract ID logged is a token in the wallet that the registry doesn't know about. Add it to `server/portfolio/tokens.js` if it's a token Staxiq should price (sBTC, stablecoins, stSTX); ignore if it's a long-tail token.

The fact that unknown tokens are LOGGED but the response still works correctly is the whole point of the registry pattern — adding new tokens is a one-line change with no other consequences.
