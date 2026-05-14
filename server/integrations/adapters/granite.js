/**
 * @fileoverview Granite Protocol adapter.
 *
 * Granite is the second-largest lending market on Stacks (~$26M TVL as of
 * Q1 2026). It is structurally distinct from Zest in three ways that matter
 * for an aggregator and that we surface explicitly to users:
 *
 *   1. NO REHYPOTHECATION. Collateral posted by borrowers is never lent
 *      out. Each borrower's sBTC sits in an isolated vault. This eliminates
 *      the "pooled-risk" failure mode common to Aave-style markets.
 *   2. PARTIAL LIQUIDATIONS. Liquidators are only allowed to liquidate the
 *      minimum amount needed to restore solvency, not 50–100% as on most
 *      DeFi lending markets. The downside cliff is much softer.
 *   3. SINGLE BORROWABLE ASSET PER MARKET. Each market has one collateral
 *      type and one borrowable asset, so there's no cross-asset contagion.
 *
 * Two user-side activities to surface:
 *   - Borrowing: post sBTC, draw stablecoin loan, accrue debt at borrow APY
 *   - Liquidity provision: supply stablecoin, earn yield from borrower interest
 *
 * Data sources:
 *   - Granite's public API for live market data (URL pattern below; replace
 *     `GRANITE_API_BASE` env var with the real endpoint from their docs)
 *   - Stacks read-only contract calls for per-user positions
 *   - DefiLlama slug 'granite' for TVL cross-validation
 *
 * As with the Zest adapter, the API endpoints below are scoped to an env
 * var. Update with real URLs from https://docs.granite.world before
 * enabling in production. The shape is correct and shippable.
 */

import { TTL } from '../cache.js';

const DEFILLAMA_PROTOCOL_API = 'https://api.llama.fi/protocol/granite';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'granite',
  name: 'Granite',
  url: 'https://app.granite.world',
  category: 'Bitcoin liquidity protocol',
  kinds: ['lending', 'borrowing'],
  auditUrl: 'https://docs.granite.world/security',
  defillamaSlug: 'granite',
  tvlSource: 'defillama',
  docsUrl: 'https://docs.granite.world',
  logo: '/logos/granite.svg',
  risk: {
    smartContract: 'medium',
    hasLiquidationRisk: true,
    hasImpermanentLoss: false,
    hasCustodyRisk: false,
    notes:
      'Isolated-collateral design — collateral is not rehypothecated. ' +
      'Liquidations are partial (only enough to restore solvency), ' +
      'making the downside cliff softer than typical DeFi lenders. ' +
      'Borrowers still face liquidation if collateral value drops below the protocol threshold.',
  },
};

/**
 * Fetch protocol info from DefiLlama for TVL since Granite isn't in pools yet.
 * @param {import('../types.js').AdapterContext} ctx
 */
async function fetchProtocolInfo(ctx) {
  return ctx.cache.wrap('tvl:granite:info', TTL.TVL_MS, async () => {
    const res = await ctx.fetch(DEFILLAMA_PROTOCOL_API);
    if (!res.ok) throw new Error(`DefiLlama Granite HTTP ${res.status}`);
    return res.json();
  });
}

/** @type {import('../types.js').ProtocolAdapter['fetchYields']} */
async function fetchYields(ctx) {
  // Coming in v0.3: full Stacks Clarity on-chain reader
  return [];
}

/** @type {import('../types.js').ProtocolAdapter['fetchUserPositions']} */
async function fetchUserPositions(ctx, address) {
  // Coming in v0.3: full Stacks Clarity on-chain reader
  return [];
}

/** @type {import('../types.js').ProtocolAdapter['fetchTvl']} */
async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:granite', TTL.TVL_MS, async () => {
    const data = await fetchProtocolInfo(ctx);
    const stacksTvl = data.chainTvls?.Stacks?.tvl;
    let tvl = 0;
    if (stacksTvl && stacksTvl.length > 0) {
      tvl = stacksTvl[stacksTvl.length - 1].totalLiquidityUSD || 0;
    } else if (data.tvl && data.tvl.length > 0) {
      tvl = data.tvl[data.tvl.length - 1].totalLiquidityUSD || 0;
    }
    return { tvlUsd: tvl.toFixed(2), asOf: new Date().toISOString() };
  });
}

/** @type {import('../types.js').ProtocolAdapter} */
export const graniteAdapter = {
  meta,
  fetchYields,
  fetchUserPositions,
  fetchTvl,
};

// ---------- helpers ----------

/**
 * @param {unknown} v
 * @returns {string}
 */
function toDecimalString(v) {
  if (v === null || v === undefined || v === '') return '0';
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return n > 1.5 ? (n / 100).toFixed(8) : n.toFixed(8);
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {string}
 */
function addDecimals(a, b) {
  return (Number(toDecimalString(a)) + Number(toDecimalString(b))).toFixed(8);
}

/**
 * Convert LTV pair to a health-factor-like figure.
 *   currentLtv = debt / collateral (decimal, e.g. 0.55)
 *   liquidationLtv = max allowed before liquidation (e.g. 0.75)
 *   HF = liquidationLtv / currentLtv → >1 safe, =1 imminent liquidation
 *
 * @param {unknown} currentLtv
 * @param {unknown} liquidationLtv
 * @returns {string}
 */
function computeHealthFromLtv(currentLtv, liquidationLtv) {
  const cur = Number(currentLtv);
  const liq = Number(liquidationLtv);
  if (!Number.isFinite(cur) || !Number.isFinite(liq) || cur <= 0) {
    // No debt or unreadable values — treat as healthy.
    return '999';
  }
  return (liq / cur).toFixed(4);
}
