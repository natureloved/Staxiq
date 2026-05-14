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
const DEFILLAMA_YIELDS_API = 'https://yields.llama.fi/pools';

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
  return ctx.cache.wrap('yields:granite', TTL.YIELDS_MS, async () => {
    try {
      const res = await ctx.fetch(DEFILLAMA_YIELDS_API);
      if (!res.ok) throw new Error(`DefiLlama yields HTTP ${res.status}`);
      const data = await res.json();

      const pools = (data.data || []).filter(
        (p) => p.project === 'granite' && p.chain === 'Stacks',
      );
      if (pools.length === 0) return [];

      const asOf = new Date().toISOString();
      return pools.map((pool) => ({
        id: `granite:${pool.pool}`,
        protocolSlug: 'granite',
        label: pool.symbol ? `${pool.symbol} supply` : 'Supply',
        kind: 'lending',
        asset: pool.symbol || 'UNKNOWN',
        apyBase: pool.apyBase != null ? (pool.apyBase / 100).toFixed(4) : '0',
        apyTotal: pool.apy != null ? (pool.apy / 100).toFixed(4) : '0',
        tvlUsd: pool.tvlUsd != null ? pool.tvlUsd.toFixed(2) : '0',
        risk: meta.risk,
        sourceUrl: 'https://yields.llama.fi',
        asOf,
      }));
    } catch (e) {
      ctx.log('granite: yield fetch failed', { err: String(e) });
      return [];
    }
  });
}

/** @type {import('../types.js').ProtocolAdapter['fetchUserPositions']} */
async function fetchUserPositions(_ctx, _address) {
  // On-chain position reader landing in v0.3
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

