/**
 * @fileoverview StackingDAO adapter.
 *
 * StackingDAO is a pooled liquid stacking protocol on Stacks. Users deposit
 * STX and receive stSTX (liquid receipt token) that tracks stacked STX value
 * plus BTC rewards. The pooled approach removes the high solo-stacker minimum.
 *
 * Data sources:
 *   - DefiLlama pools API for yield/TVL data
 *   - Hiro API + on-chain contract reads for user positions
 */

import { TTL } from '../cache.js';

const DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'stackingdao',
  name: 'StackingDAO',
  url: 'https://stakingdao.co',
  category: 'Liquid stacking',
  kinds: ['staking'],
  defillamaSlug: 'stackingdao',
  tvlSource: 'defillama',
  docsUrl: 'https://docs.stackingdao.co',
  logo: '/logos/stackingdao.svg',
  risk: {
    smartContract: 'medium',
    hasLiquidationRisk: false,
    hasImpermanentLoss: false,
    hasCustodyRisk: false,
    notes: 'Pooled stacking — STX is locked in the pool contract, not transferred to a third party. Rewards paid in BTC. Smart contract risk is mitigated by timelocks and multi-sig controls.',
  },
};

const STACKINGDAO_CONTRACT = 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG';
const STSTX_TOKEN = `${STACKINGDAO_CONTRACT}.ststx-token`;

async function fetchPools(ctx) {
  return ctx.cache.wrap('yields:stackingdao:pools', TTL.YIELDS_MS, async () => {
    const res = await ctx.fetch(DEFILLAMA_POOLS_API);
    if (!res.ok) throw new Error(`DefiLlama pools HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || []).filter(
      (p) => p.project === 'stackingdao' && p.chain === 'Stacks',
    );
  });
}

async function fetchYields(ctx) {
  const pools = await fetchPools(ctx);
  const asOf = new Date().toISOString();
  return pools.map((pool) => ({
    id: `stackingdao:stx-pool`,
    protocolSlug: 'stackingdao',
    label: `Pool STX, earn BTC · ${pool.symbol || 'stSTX'}`,
    kind: 'staking',
    asset: pool.symbol || 'stSTX',
    apyBase: pool.apyBase != null ? (pool.apyBase / 100).toFixed(4) : '0',
    apyReward: pool.apyReward != null ? (pool.apyReward / 100).toFixed(4) : '0',
    apyTotal: pool.apy != null ? (pool.apy / 100).toFixed(4) : '0',
    tvlUsd: pool.tvlUsd != null ? pool.tvlUsd.toFixed(2) : '0',
    risk: meta.risk,
    sourceUrl: 'https://app.stackingdao.co',
    asOf,
  }));
}

async function fetchUserPositions(ctx, address) {
  if (!address) return [];
  const key = `positions:stackingdao:${address}`;
  return ctx.cache.wrap(key, TTL.POSITIONS_MS, async () => {
    const [tokenRes, poxRes] = await Promise.all([
      ctx.fetch(
        `https://api.hiro.so/extended/v1/address/${address}/balances`,
        { headers: { Accept: 'application/json' } },
      ),
      ctx.fetch(`https://api.hiro.so/v2/pox_address/${address}`),
    ]);

    const positions = [];

    if (tokenRes.ok) {
      const balances = (await tokenRes.json()).fungible_tokens || {};
      const ststxRaw = balances[STSTX_TOKEN]?.balance || '0';
      const ststxBalance = BigInt(ststxRaw);
      if (ststxBalance > 0n) {
        const stxAmount = (Number(ststxBalance) / 1_000_000).toFixed(6);
        positions.push({
          id: `stackingdao:ststx:${address}`,
          protocolSlug: 'stackingdao',
          kind: 'staking',
          principal: {
            symbol: 'stSTX',
            amount: stxAmount,
            usdValue: '0',
          },
          apyTotal: '0.07',
          sourceUrl: 'https://app.stackingdao.co',
          asOf: new Date().toISOString(),
        });
      }
    }

    if (poxRes.ok) {
      const poxData = await poxRes.json();
      const locked = BigInt(poxData.locked || '0');
      if (locked > 0n) {
        positions.push({
          id: `stackingdao:pox-stacked:${address}`,
          protocolSlug: 'stackingdao',
          kind: 'staking',
          principal: {
            symbol: 'STX (stacked)',
            amount: (Number(locked) / 1e6).toFixed(6),
            usdValue: '0',
          },
          apyTotal: '0.07',
          sourceUrl: 'https://app.stackingdao.co',
          asOf: new Date().toISOString(),
        });
      }
    }

    return positions;
  });
}

async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:stackingdao', TTL.TVL_MS, async () => {
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
export const stackingDaoAdapter = {
  meta,
  fetchYields,
  fetchUserPositions,
  fetchTvl,
};
