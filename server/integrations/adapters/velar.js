/**
 * @fileoverview Velar adapter.
 *
 * Velar is a DEX on Stacks offering concentrated liquidity and yield farming
 * for STX, sBTC, and other Stacks-native assets.
 *
 * Data sources:
 *   - DefiLlama pools API for live yield/TVL data
 *   - Hiro API for LP token balance detection
 */

import { TTL } from '../cache.js';

const DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'velar',
  name: 'Velar',
  url: 'https://velar.co',
  category: 'DEX / Concentrated Liquidity',
  kinds: ['liquidity'],
  defillamaSlug: 'velar',
  tvlSource: 'defillama',
  docsUrl: 'https://docs.velar.co',
  logo: '/logos/velar.svg',
  risk: {
    smartContract: 'medium',
    hasLiquidationRisk: false,
    hasImpermanentLoss: true,
    hasCustodyRisk: false,
    notes: 'Concentrated liquidity positions carry IL risk, especially in volatile markets. Always set a tight range or use the passive range strategy to minimize manual management.',
  },
};

const VELAR_CONTRACT_PREFIX = 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1';

async function fetchPools(ctx) {
  return ctx.cache.wrap('yields:velar:pools', TTL.YIELDS_MS, async () => {
    const res = await ctx.fetch(DEFILLAMA_POOLS_API);
    if (!res.ok) throw new Error(`DefiLlama pools HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || []).filter(
      (p) => p.project === 'velar' && p.chain === 'Stacks',
    );
  });
}

async function fetchYields(ctx) {
  const pools = await fetchPools(ctx);
  const asOf = new Date().toISOString();
  return pools.map((pool) => ({
    id: `velar:${pool.pool}`,
    protocolSlug: 'velar',
    label: pool.symbol ? `${pool.symbol} pool` : 'Velar pool',
    kind: 'liquidity',
    asset: pool.symbol || 'VELAR',
    apyBase: pool.apyBase != null ? (pool.apyBase / 100).toFixed(4) : '0',
    apyReward: pool.apyReward != null ? (pool.apyReward / 100).toFixed(4) : '0',
    apyTotal: pool.apy != null ? (pool.apy / 100).toFixed(4) : '0',
    tvlUsd: pool.tvlUsd != null ? pool.tvlUsd.toFixed(2) : '0',
    risk: meta.risk,
    sourceUrl: 'https://app.velar.co',
    asOf,
  }));
}

async function fetchUserPositions(ctx, address) {
  if (!address) return [];
  const key = `positions:velar:${address}`;
  return ctx.cache.wrap(key, TTL.POSITIONS_MS, async () => {
    const res = await ctx.fetch(
      `https://api.hiro.so/extended/v1/address/${address}/balances`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return [];

    const balances = (await res.json()).fungible_tokens || {};
    const positions = [];

    for (const [tokenId, info] of Object.entries(balances)) {
      if (!tokenId.startsWith(VELAR_CONTRACT_PREFIX)) continue;
      const raw = info.balance || '0';
      if (BigInt(raw) === 0n) continue;
      const amount = (Number(BigInt(raw)) / 1_000_000).toFixed(6);
      positions.push({
        id: `velar:${tokenId}:${address}`,
        protocolSlug: 'velar',
        kind: 'liquidity',
        principal: {
          symbol: tokenId.split('.')[1] || 'VELAR-LP',
          amount,
          usdValue: '0',
        },
        apyTotal: '0.06',
        sourceUrl: 'https://app.velar.co',
        asOf: new Date().toISOString(),
      });
    }

    return positions;
  });
}

async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:velar', TTL.TVL_MS, async () => {
    try {
      const pools = await fetchPools(ctx);
      const tvl = pools.reduce((sum, p) => sum + (Number(p.tvlUsd) || 0), 0);
      return { tvlUsd: tvl.toFixed(2), asOf: new Date().toISOString() };
    } catch {
      return { tvlUsd: '0', asOf: new Date().toISOString() };
    }
  });
}

/** @type {import('../types.js').ProtocolAdapter} */
export const velarAdapter = {
  meta,
  fetchYields,
  fetchUserPositions,
  fetchTvl,
};
