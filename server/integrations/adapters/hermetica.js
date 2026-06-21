/**
 * @fileoverview Hermetica adapter.
 *
 * Hermetica is a yield protocol on Stacks offering USDh (Bitcoin-backed
 * synthetic dollar) and related yield products. Users can mint USDh against
 * sBTC collateral and earn yield on supplied assets.
 *
 * Data sources:
 *   - DefiLlama pools API for live yield/TVL data
 *   - Hiro API for USDh token balance detection
 */

import { TTL } from '../cache.js';

const DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'hermetica',
  name: 'Hermetica',
  url: 'https://hermetica.finance',
  category: 'Stablecoin / Yield',
  kinds: ['stablecoin', 'liquidity'],
  defillamaSlug: 'hermetica',
  tvlSource: 'defillama',
  docsUrl: 'https://docs.hermetica.finance',
  logo: '/logos/hermetica.svg',
  risk: {
    smartContract: 'high',
    hasLiquidationRisk: true,
    hasImpermanentLoss: false,
    hasCustodyRisk: false,
    notes: 'USDh is a synthetic dollar backed by sBTC. Minting positions carry liquidation risk if sBTC collateral value drops. Protocol is newer and carries higher smart contract risk; verify audit status.',
  },
};

const HERMETICA_CONTRACT_PREFIX = 'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1N';

async function fetchPools(ctx) {
  return ctx.cache.wrap('yields:hermetica:pools', TTL.YIELDS_MS, async () => {
    const res = await ctx.fetch(DEFILLAMA_POOLS_API);
    if (!res.ok) throw new Error(`DefiLlama pools HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || []).filter(
      (p) => p.project === 'hermetica' && p.chain === 'Stacks',
    );
  });
}

async function fetchYields(ctx) {
  const pools = await fetchPools(ctx);
  const asOf = new Date().toISOString();
  return pools.map((pool) => ({
    id: `hermetica:${pool.pool}`,
    protocolSlug: 'hermetica',
    label: pool.symbol ? `${pool.symbol} supply` : 'USDh pool',
    kind: 'stablecoin',
    asset: pool.symbol || 'USDh',
    apyBase: pool.apyBase != null ? (pool.apyBase / 100).toFixed(4) : '0',
    apyReward: pool.apyReward != null ? (pool.apyReward / 100).toFixed(4) : '0',
    apyTotal: pool.apy != null ? (pool.apy / 100).toFixed(4) : '0',
    tvlUsd: pool.tvlUsd != null ? pool.tvlUsd.toFixed(2) : '0',
    risk: meta.risk,
    sourceUrl: 'https://app.hermetica.finance',
    asOf,
  }));
}

async function fetchUserPositions(ctx, address) {
  if (!address) return [];
  const key = `positions:hermetica:${address}`;
  return ctx.cache.wrap(key, TTL.POSITIONS_MS, async () => {
    const res = await ctx.fetch(
      `https://api.hiro.so/extended/v1/address/${address}/balances`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return [];

    const balances = (await res.json()).fungible_tokens || {};
    const positions = [];

    for (const [tokenId, info] of Object.entries(balances)) {
      if (!tokenId.startsWith(HERMETICA_CONTRACT_PREFIX)) continue;
      const raw = info.balance || '0';
      if (BigInt(raw) === 0n) continue;
      const decimals = tokenId.includes('sbtc') ? 8 : 6;
      const divisor = 10 ** decimals;
      const amount = (Number(BigInt(raw)) / divisor).toFixed(6);
      positions.push({
        id: `hermetica:${tokenId}:${address}`,
        protocolSlug: 'hermetica',
        kind: tokenId.includes('usdh') ? 'stablecoin' : 'liquidity',
        principal: {
          symbol: tokenId.split('.')[1] || 'USDh',
          amount,
          usdValue: '0',
        },
        apyTotal: '0.05',
        sourceUrl: 'https://app.hermetica.finance',
        asOf: new Date().toISOString(),
      });
    }

    return positions;
  });
}

async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:hermetica', TTL.TVL_MS, async () => {
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
export const hermeticaAdapter = {
  meta,
  fetchYields,
  fetchUserPositions,
  fetchTvl,
};
