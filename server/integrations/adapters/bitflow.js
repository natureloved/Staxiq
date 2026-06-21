/**
 * @fileoverview Bitflow adapter.
 *
 * Bitflow is a DEX on Stacks focused on STX/bitcoin trading pairs.
 * It offers liquidity pools (LP) and yield farming.
 *
 * Data sources:
 *   - DefiLlama pools API for live yield/TVL data
 *   - Hiro API for LP token balance detection
 */

import { TTL } from '../cache.js';

const DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'bitflow',
  name: 'Bitflow',
  url: 'https://bitflow.finance',
  category: 'DEX / Liquidity',
  kinds: ['liquidity'],
  defillamaSlug: 'bitflow',
  tvlSource: 'defillama',
  docsUrl: 'https://docs.bitflow.finance',
  logo: '/logos/bitflow.svg',
  risk: {
    smartContract: 'medium',
    hasLiquidationRisk: false,
    hasImpermanentLoss: true,
    hasCustodyRisk: false,
    notes: 'LP positions experience impermanent loss if token ratios drift. Smart contracts have been audited; always verify the latest audit report before depositing significant amounts.',
  },
};

const BITFLOW_CONTRACT_PREFIX = 'STTWD9SPRQVD3P733V89SV0P8EP8QSB5B00ZBZQ';

async function fetchPools(ctx) {
  return ctx.cache.wrap('yields:bitflow:pools', TTL.YIELDS_MS, async () => {
    const res = await ctx.fetch(DEFILLAMA_POOLS_API);
    if (!res.ok) throw new Error(`DefiLlama pools HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || []).filter(
      (p) => p.project === 'bitflow' && p.chain === 'Stacks',
    );
  });
}

async function fetchYields(ctx) {
  const pools = await fetchPools(ctx);
  const asOf = new Date().toISOString();
  return pools.map((pool) => ({
    id: `bitflow:${pool.pool}`,
    protocolSlug: 'bitflow',
    label: pool.symbol ? `${pool.symbol} LP` : 'Liquidity Provision',
    kind: 'liquidity',
    asset: pool.symbol || 'LP',
    apyBase: pool.apyBase != null ? (pool.apyBase / 100).toFixed(4) : '0',
    apyReward: pool.apyReward != null ? (pool.apyReward / 100).toFixed(4) : '0',
    apyTotal: pool.apy != null ? (pool.apy / 100).toFixed(4) : '0',
    tvlUsd: pool.tvlUsd != null ? pool.tvlUsd.toFixed(2) : '0',
    risk: meta.risk,
    sourceUrl: 'https://app.bitflow.finance',
    asOf,
  }));
}

async function fetchUserPositions(ctx, address) {
  if (!address) return [];
  const key = `positions:bitflow:${address}`;
  return ctx.cache.wrap(key, TTL.POSITIONS_MS, async () => {
    const res = await ctx.fetch(
      `https://api.hiro.so/extended/v1/address/${address}/balances`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return [];

    const balances = (await res.json()).fungible_tokens || {};
    const positions = [];

    for (const [tokenId, info] of Object.entries(balances)) {
      if (!tokenId.startsWith(BITFLOW_CONTRACT_PREFIX)) continue;
      const raw = info.balance || '0';
      if (BigInt(raw) === 0n) continue;
      const amount = (Number(BigInt(raw)) / 1_000_000).toFixed(6);
      positions.push({
        id: `bitflow:lp:${tokenId}:${address}`,
        protocolSlug: 'bitflow',
        kind: 'liquidity',
        principal: {
          symbol: tokenId.split('.')[1] || 'LP',
          amount,
          usdValue: '0',
        },
        apyTotal: '0.05',
        sourceUrl: 'https://app.bitflow.finance',
        asOf: new Date().toISOString(),
      });
    }

    return positions;
  });
}

async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:bitflow', TTL.TVL_MS, async () => {
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
export const bitflowAdapter = {
  meta,
  fetchYields,
  fetchUserPositions,
  fetchTvl,
};
