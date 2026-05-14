/**
 * @fileoverview Portfolio snapshot builder.
 *
 * This is the single function the route handler calls to assemble everything
 * the rubric and the AI Copilot need. It takes:
 *   - An address
 *   - A list of UserPositions (already gathered via `fanOut`)
 *
 * …and returns a fully-priced PortfolioSnapshot:
 *   - `balances[]` with USD values
 *   - `positions[]` with USD values backfilled where adapters left them at 0
 *   - `totalUsd` = balances + position principals
 *
 * The shape exactly matches what `server/healthScore/rubric.js` and
 * `server/ai/insights/idleCapital.js` expect — no glue code in the route.
 */

import { fetchBalances } from './balances.js';
import { getPrices, multiplyToUsd } from './prices.js';

/**
 * @param {import('../integrations/types.js').AdapterContext} ctx
 * @param {string} address
 * @param {import('../integrations/types.js').UserPosition[]} positions
 * @returns {Promise<import('../healthScore/rubric.js').PortfolioSnapshot>}
 */
export async function buildSnapshot(ctx, address, positions) {
  // 1. Fetch wallet balances. Degrade to empty on failure so the rest of
  //    the snapshot still works — the user might still have valuable
  //    positions even if the wallet endpoint is down.
  /** @type {import('./balances.js').WalletBalance[]} */
  let balances = [];
  try {
    balances = await fetchBalances(ctx, address);
  } catch (err) {
    ctx.log('snapshot: fetchBalances failed, continuing with empty balances', {
      address,
      err: String(err),
    });
  }

  // 2. Determine every distinct symbol we need a price for.
  /** @type {Set<string>} */
  const symbolsNeeded = new Set();
  for (const b of balances) symbolsNeeded.add(b.symbol);
  for (const p of positions) {
    symbolsNeeded.add(p.principal.symbol);
    if (p.debt) symbolsNeeded.add(p.debt.symbol);
    if (p.rewards) symbolsNeeded.add(p.rewards.symbol);
  }

  const prices =
    symbolsNeeded.size > 0
      ? await getPrices(ctx, [...symbolsNeeded])
      : /** @type {Record<string, string>} */ ({});

  // 3. Price the wallet balances.
  /** @type {Array<{ symbol: string, usdValue: string }>} */
  const pricedBalances = balances.map((b) => ({
    symbol: b.symbol,
    amount: b.amount,                              // kept for UI display
    usdValue: multiplyToUsd(b.amount, prices[b.symbol]),
    kind: b.kind,
  }));

  // 4. Backfill USD values on positions where the adapter left them as 0
  //    (the PoX adapter does this, since it doesn't carry a price oracle).
  //    We never overwrite a non-zero value the adapter provided — adapters
  //    closer to the protocol may have better USD numbers than our oracle.
  const enrichedPositions = positions.map((p) => {
    const principal = backfillUsd(p.principal, prices);
    const debt = p.debt ? backfillUsd(p.debt, prices) : undefined;
    const rewards = p.rewards ? backfillUsd(p.rewards, prices) : undefined;
    return { ...p, principal, debt, rewards };
  });

  // 5. Compute totalUsd. Wallet balances + position principals. We deliberately
  //    do NOT subtract debt — it's a liability tracked on the position itself,
  //    and the rubric examines health factor independently.
  let total = 0;
  for (const b of pricedBalances) total += Number(b.usdValue) || 0;
  for (const p of enrichedPositions) total += Number(p.principal.usdValue) || 0;

  return {
    address,
    totalUsd: total.toFixed(2),
    balances: pricedBalances,
    positions: enrichedPositions,
  };
}

/**
 * @param {import('../integrations/types.js').TokenAmount} ta
 * @param {Record<string, string>} prices
 * @returns {import('../integrations/types.js').TokenAmount}
 */
function backfillUsd(ta, prices) {
  if (ta.usdValue && Number(ta.usdValue) > 0) return ta;
  const usd = multiplyToUsd(ta.amount, prices[ta.symbol]);
  return { ...ta, usdValue: usd };
}
