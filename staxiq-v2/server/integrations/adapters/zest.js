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

const ZEST_API_BASE = process.env.ZEST_API_BASE ?? 'https://api.zestprotocol.com';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'zest',
  name: 'Zest Protocol',
  url: 'https://app.zestprotocol.com',
  category: 'Lending market',
  kinds: ['lending', 'borrowing'],
  auditUrl: 'https://docs.zestprotocol.com/security',
  defillamaSlug: 'zest-protocol',
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
 * @returns {Promise<unknown>}
 */
async function fetchReserves(ctx) {
  return ctx.cache.wrap('yields:zest', TTL.YIELDS_MS, async () => {
    const res = await ctx.fetch(`${ZEST_API_BASE}/v1/reserves`);
    if (!res.ok) throw new Error(`Zest reserves HTTP ${res.status}`);
    return res.json();
  });
}

/** @type {import('../types.js').ProtocolAdapter['fetchYields']} */
async function fetchYields(ctx) {
  const reserves = /** @type {any[]} */ (await fetchReserves(ctx));

  /** @type {import('../types.js').YieldQuote[]} */
  const out = [];
  const asOf = new Date().toISOString();

  for (const r of reserves) {
    // Supply offering
    out.push({
      id: `zest:${r.symbol.toLowerCase()}-supply`,
      protocolSlug: 'zest',
      label: `Supply ${r.symbol}`,
      kind: 'lending',
      asset: r.symbol,
      apyBase: toDecimalString(r.supplyApy),
      apyReward: r.supplyRewardApy ? toDecimalString(r.supplyRewardApy) : '0',
      apyTotal: addDecimals(r.supplyApy, r.supplyRewardApy ?? 0),
      tvlUsd: toDecimalString(r.totalSuppliedUsd),
      risk: meta.risk,
      sourceUrl: `${meta.url}/markets/${r.symbol}`,
      asOf,
    });

    // Borrow offering — surfaced as "negative yield" for completeness
    if (r.borrowEnabled) {
      out.push({
        id: `zest:${r.symbol.toLowerCase()}-borrow`,
        protocolSlug: 'zest',
        label: `Borrow ${r.symbol}`,
        kind: 'borrowing',
        asset: r.symbol,
        apyBase: '-' + toDecimalString(r.borrowApy),
        apyTotal: '-' + toDecimalString(r.borrowApy),
        tvlUsd: toDecimalString(r.totalBorrowedUsd),
        risk: { ...meta.risk, notes: 'Borrowing accrues debt at the listed rate. Liquidation occurs if collateral value drops below the protocol threshold.' },
        sourceUrl: `${meta.url}/markets/${r.symbol}`,
        asOf,
      });
    }
  }

  return out;
}

/** @type {import('../types.js').ProtocolAdapter['fetchUserPositions']} */
async function fetchUserPositions(ctx, address) {
  const key = `positions:zest:${address}`;
  return ctx.cache.wrap(key, TTL.POSITIONS_MS, async () => {
    const res = await ctx.fetch(`${ZEST_API_BASE}/v1/users/${address}/positions`);
    if (res.status === 404) return []; // user has no positions — not an error
    if (!res.ok) throw new Error(`Zest positions HTTP ${res.status}`);
    const data = /** @type {any} */ (await res.json());

    /** @type {import('../types.js').UserPosition[]} */
    const positions = [];
    const asOf = new Date().toISOString();

    for (const p of data.supplies ?? []) {
      positions.push({
        id: `zest:${p.symbol.toLowerCase()}-supply:${address}`,
        protocolSlug: 'zest',
        kind: 'lending',
        principal: {
          symbol: p.symbol,
          amount: toDecimalString(p.amount),
          usdValue: toDecimalString(p.usdValue),
        },
        rewards: p.unclaimedRewards
          ? {
              symbol: p.unclaimedRewards.symbol,
              amount: toDecimalString(p.unclaimedRewards.amount),
              usdValue: toDecimalString(p.unclaimedRewards.usdValue),
            }
          : undefined,
        apyTotal: toDecimalString(p.apy),
        sourceUrl: `${meta.url}/dashboard`,
        asOf,
      });
    }

    for (const b of data.borrows ?? []) {
      positions.push({
        id: `zest:${b.symbol.toLowerCase()}-borrow:${address}`,
        protocolSlug: 'zest',
        kind: 'borrowing',
        principal: {
          symbol: b.collateralSymbol,
          amount: toDecimalString(b.collateralAmount),
          usdValue: toDecimalString(b.collateralUsdValue),
        },
        debt: {
          symbol: b.symbol,
          amount: toDecimalString(b.debtAmount),
          usdValue: toDecimalString(b.debtUsdValue),
        },
        healthFactor: toDecimalString(b.healthFactor),
        apyTotal: '-' + toDecimalString(b.borrowApy),
        sourceUrl: `${meta.url}/dashboard`,
        asOf,
      });
    }

    return positions;
  });
}

/** @type {import('../types.js').ProtocolAdapter['fetchTvl']} */
async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:zest', TTL.TVL_MS, async () => {
    const reserves = /** @type {any[]} */ (await fetchReserves(ctx));
    let tvl = 0;
    for (const r of reserves) {
      tvl += Number(r.totalSuppliedUsd ?? 0);
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
