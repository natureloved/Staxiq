/**
 * @fileoverview ALEX Lab adapter.
 *
 * ALEX Lab is a leading DEX and yield platform on Stacks. It offers
 * automated vault strategies (autoALEX) and manual liquidity pools.
 *
 * Data sources:
 *   - DefiLlama pools API for live yield/TVL data
 *   - Hiro API for LP/vault token balance detection
 */

import { TTL } from '../cache.js';

const DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'alex',
  name: 'ALEX Lab',
  url: 'https://alexlab.co',
  category: 'DEX / Yield',
  kinds: ['liquidity', 'vault'],
  defillamaSlug: 'alex',
  tvlSource: 'defillama',
  docsUrl: 'https://docs.alexlab.co',
  logo: '/logos/alex.svg',
  risk: {
    smartContract: 'medium',
    hasLiquidationRisk: false,
    hasImpermanentLoss: true,
    hasCustodyRisk: false,
    notes: 'ALEX runs a traditional AMM DEX with yield vaults. IL applies to LP positions. Vault strategies have varying risk profiles; check each vault\'s documentation.',
  },
};

const ALEX_CONTRACT_PREFIX = 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9';

async function fetchPools(ctx) {
  return ctx.cache.wrap('yields:alex:pools', TTL.YIELDS_MS, async () => {
    const res = await ctx.fetch(DEFILLAMA_POOLS_API);
    if (!res.ok) throw new Error(`DefiLlama pools HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || []).filter(
      (p) => (p.project === 'alex' || p.project === 'alex-v2') && p.chain === 'Stacks',
    );
  });
}

async function fetchYields(ctx) {
  const pools = await fetchPools(ctx);
  const asOf = new Date().toISOString();
  return pools.map((pool) => ({
    id: `alex:${pool.pool}`,
    protocolSlug: 'alex',
    label: pool.symbol ? `${pool.symbol} pool` : 'ALEX pool',
    kind: pool.symbol?.includes('LP') || pool.symbol?.includes('-') ? 'liquidity' : 'vault',
    asset: pool.symbol || 'ALEX',
    apyBase: pool.apyBase != null ? (pool.apyBase / 100).toFixed(4) : '0',
    apyReward: pool.apyReward != null ? (pool.apyReward / 100).toFixed(4) : '0',
    apyTotal: pool.apy != null ? (pool.apy / 100).toFixed(4) : '0',
    tvlUsd: pool.tvlUsd != null ? pool.tvlUsd.toFixed(2) : '0',
    risk: meta.risk,
    sourceUrl: 'https://app.alexlab.co',
    asOf,
  }));
}

async function fetchUserPositions(ctx, address) {
  if (!address) return [];
  const key = `positions:alex:${address}`;
  return ctx.cache.wrap(key, TTL.POSITIONS_MS, async () => {
    const res = await ctx.fetch(
      `https://api.hiro.so/extended/v1/address/${address}/balances`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return [];

    const balances = (await res.json()).fungible_tokens || {};
    const positions = [];

    for (const [tokenId, info] of Object.entries(balances)) {
      if (!tokenId.startsWith(ALEX_CONTRACT_PREFIX)) continue;
      const raw = info.balance || '0';
      if (BigInt(raw) === 0n) continue;
      const amount = (Number(BigInt(raw)) / 1_000_000).toFixed(6);
      positions.push({
        id: `alex:${tokenId}:${address}`,
        protocolSlug: 'alex',
        kind: tokenId.includes('auto-') ? 'vault' : 'liquidity',
        principal: {
          symbol: tokenId.split('.')[1] || 'ALEX',
          amount,
          usdValue: '0',
        },
        apyTotal: '0.04',
        sourceUrl: 'https://app.alexlab.co',
        asOf: new Date().toISOString(),
      });
    }

    return positions;
  });
}

async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:alex', TTL.TVL_MS, async () => {
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
export const alexAdapter = {
  meta,
  fetchYields,
  fetchUserPositions,
  fetchTvl,
};
