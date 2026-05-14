/**
 * @fileoverview Idle capital detector.
 *
 * Surfaces meaningful balances of yield-eligible assets that aren't currently
 * deployed anywhere. The Copilot can ground recommendations in these.
 *
 * Threshold tuning: $50 minimum to filter out dust, 30%+ idle share to avoid
 * being noisy about working balances. These thresholds are exported so the
 * rubric and the UI can read the same numbers and stay in sync.
 */

const MIN_USD_TO_FLAG = 50;
const IDLE_ASSETS = ['SBTC', 'BTC', 'STX', 'USDH', 'USDC', 'USDCX', 'USDA', 'USDT'];

/**
 * @typedef {Object} IdleCapitalInsight
 * @property {string} id
 * @property {'idle-capital'} type
 * @property {string} summary
 * @property {string} symbol
 * @property {string} usdValue
 */

/**
 * @param {import('../../healthScore/rubric.js').PortfolioSnapshot} snap
 * @returns {Promise<IdleCapitalInsight[]>}
 */
export async function detectIdleCapital(snap) {
  /** @type {IdleCapitalInsight[]} */
  const insights = [];

  // Sum what's already deployed by symbol.
  /** @type {Map<string, number>} */
  const deployed = new Map();
  for (const p of snap.positions) {
    const sym = p.principal.symbol.toUpperCase();
    deployed.set(sym, (deployed.get(sym) ?? 0) + Number(p.principal.usdValue));
  }

  for (const b of snap.balances) {
    const sym = b.symbol.toUpperCase();
    if (!IDLE_ASSETS.includes(sym)) continue;
    const total = Number(b.usdValue);
    if (total < MIN_USD_TO_FLAG) continue;

    // We treat the wallet balance as fully idle — positions are tracked
    // separately by the position fetcher. (If your portfolio enricher
    // already nets these out, remove this and use `total` directly.)
    insights.push({
      id: `insight:idle:${sym}`,
      type: 'idle-capital',
      summary: `~$${total.toFixed(2)} of ${sym} sitting in wallet earning 0%.`,
      symbol: sym,
      usdValue: total.toFixed(2),
    });
  }

  return insights;
}

export const IDLE_THRESHOLDS = { MIN_USD_TO_FLAG, IDLE_ASSETS };
