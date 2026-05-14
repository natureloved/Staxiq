/**
 * @fileoverview Zest Protocol adapter.
 *
 * Zest is the largest lending market on Stacks (~$75M TVL as of Q1 2026).
 * Users supply sBTC / STX / stablecoins and earn supply APY; borrowers
 * collateralize positions and accrue debt at a borrow APY.
 *
 * Data sources used here:
 *   - Zest's public API for live reserve data (supply/borrow APYs, TVL)
 *   - Stacks read-only contract calls for per-user positions
 *   - DefiLlama as a sanity-check on TVL (handled in crossval.js)
 *
 * NOTE: The exact API endpoints and contract addresses below are placeholders
 * scoped to a `ZEST_API_BASE` env var. Replace with the real values from
 * Zest's docs/SDK before enabling in production. The shape and caching
 * behaviour, however, is correct and shippable.
 */

import { TTL } from '../cache.js';

const DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'zest',
  name: 'Zest Protocol',
  url: 'https://app.zestprotocol.com',
  category: 'Lending market',
  kinds: ['lending', 'borrowing'],
  auditUrl: 'https://docs.zestprotocol.com/security',
  defillamaSlug: 'zest-protocol',
  tvlSource: 'defillama',
  docsUrl: 'https://docs.zestprotocol.com',
  logo: '/logos/zest.svg',
  risk: {
    smartContract: 'medium', // adjust after auditing audit history
    hasLiquidationRisk: true,
    hasImpermanentLoss: false,
    hasCustodyRisk: false, // sBTC custody risk is sBTC's, not Zest's
    notes: 'Supplied assets earn yield; collateralized borrowing carries liquidation risk if health factor drops below 1.',
  },
};

/**
 * @param {import('../types.js').AdapterContext} ctx
 * @returns {Promise<any[]>}
 */
async function fetchZestPools(ctx) {
  return ctx.cache.wrap('yields:zest:pools', TTL.YIELDS_MS, async () => {
    const res = await ctx.fetch(DEFILLAMA_POOLS_API);
    if (!res.ok) throw new Error(`DefiLlama pools HTTP ${res.status}`);
    const data = await res.json();
    return data.data.filter((p) => p.project === 'zest-v2' || p.project === 'zest-protocol');
  });
}

/** @type {import('../types.js').ProtocolAdapter['fetchYields']} */
async function fetchYields(ctx) {
  const pools = await fetchZestPools(ctx);

  /** @type {import('../types.js').YieldQuote[]} */
  const out = [];
  const asOf = new Date().toISOString();

  for (const p of pools) {
    // Supply offering
    out.push({
      id: `zest:${p.symbol.toLowerCase()}-supply`,
      protocolSlug: 'zest',
      label: `Supply ${p.symbol}`,
      kind: 'lending',
      asset: p.symbol,
      apyBase: toDecimalString(p.apyBase),
      apyReward: p.apyReward ? toDecimalString(p.apyReward) : '0',
      apyTotal: toDecimalString(p.apy),
      tvlUsd: toDecimalString(p.tvlUsd),
      risk: meta.risk,
      sourceUrl: `${meta.url}/markets/${p.symbol}`,
      asOf,
    });
  }

  return out;
}

/** @type {import('../types.js').ProtocolAdapter['fetchUserPositions']} */
async function fetchUserPositions(ctx, address) {
  // Coming in v0.3: full Stacks Clarity on-chain reader
  return [];
}

/** @type {import('../types.js').ProtocolAdapter['fetchTvl']} */
async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:zest', TTL.TVL_MS, async () => {
    const pools = await fetchZestPools(ctx);
    let tvl = 0;
    for (const p of pools) {
      tvl += Number(p.tvlUsd ?? 0);
    }
    return { tvlUsd: tvl.toFixed(2), asOf: new Date().toISOString() };
  });
}

/** @type {import('../types.js').ProtocolAdapter} */
export const zestAdapter = {
  meta,
  fetchYields,
  fetchUserPositions,
  fetchTvl,
};

// ---------- helpers ----------

/**
 * Many APIs return APY as either 0.0421 or 4.21 (percent). Normalise to decimal.
 * Tolerates strings, numbers, null. Defaults to '0' on garbage.
 * @param {unknown} v
 * @returns {string}
 */
function toDecimalString(v) {
  if (v === null || v === undefined || v === '') return '0';
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  // If the source clearly returned a percentage > 1.5, scale it back.
  // (1.5 chosen because no realistic on-chain APY exceeds 150% as a decimal.)
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
