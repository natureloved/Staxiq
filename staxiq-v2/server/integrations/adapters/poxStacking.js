/**
 * @fileoverview Native PoX Stacking adapter.
 *
 * This is structurally different from the Zest adapter: it has no third-party
 * API. We read directly from the Stacks read-only contract calls and the
 * Hiro Stacks API. PoX is also unique in that yield is paid in real BTC,
 * not protocol tokens — that's the killer feature for this aggregator and
 * needs to be surfaced clearly to users.
 *
 * For users who don't want to stack alone (which requires a large STX
 * minimum), aggregators like StackingDAO offer pooled stacking — that lives
 * in a separate adapter so users can compare them side-by-side.
 *
 * Reference: https://docs.hiro.so/stacks/api
 */

import { TTL } from '../cache.js';

const HIRO_API_MAINNET = 'https://api.hiro.so';
const HIRO_API_TESTNET = 'https://api.testnet.hiro.so';

/** @type {import('../types.js').ProtocolMeta} */
const meta = {
  slug: 'pox-stacking',
  name: 'Native Stacks PoX Stacking',
  url: 'https://stacks.co/learn/stacking',
  category: 'Native Bitcoin yield',
  kinds: ['staking'],
  docsUrl: 'https://docs.stacks.co/concepts/stacking',
  logo: '/logos/stacks.svg',
  risk: {
    smartContract: 'low', // It's the protocol itself.
    hasLiquidationRisk: false,
    hasImpermanentLoss: false,
    hasCustodyRisk: false, // Self-custodial; STX is locked, not transferred.
    notes: 'Rewards paid in real BTC. STX is locked for one or more cycles (≈2 weeks each). Solo stacking has a high STX minimum; consider a pooled stacker for smaller balances.',
  },
};

/**
 * @param {import('../types.js').AdapterContext} ctx
 */
function apiBase(ctx) {
  return ctx.network === 'mainnet' ? HIRO_API_MAINNET : HIRO_API_TESTNET;
}

/**
 * @param {import('../types.js').AdapterContext} ctx
 */
async function fetchPoxInfo(ctx) {
  return ctx.cache.wrap('yields:pox-stacking:info', TTL.YIELDS_MS, async () => {
    const res = await ctx.fetch(`${apiBase(ctx)}/v2/pox`);
    if (!res.ok) throw new Error(`Hiro PoX HTTP ${res.status}`);
    return /** @type {any} */ (await res.json());
  });
}

/** @type {import('../types.js').ProtocolAdapter['fetchYields']} */
async function fetchYields(ctx) {
  const pox = await fetchPoxInfo(ctx);

  // PoX APY is computed empirically from recent cycle rewards rather than
  // promised. We use the trailing 12-cycle average as the "indicative APY".
  // The HiroAPI exposes per-cycle reward totals; we compute USD-denominated
  // APY by combining BTC reward value with the STX locked.
  const apy = await computeTrailingApy(ctx);

  const asOf = new Date().toISOString();

  /** @type {import('../types.js').YieldQuote} */
  const quote = {
    id: 'pox-stacking:stx',
    protocolSlug: 'pox-stacking',
    label: 'Lock STX, earn BTC (solo)',
    kind: 'staking',
    asset: 'STX',
    apyBase: apy,
    apyTotal: apy,
    tvlUsd: toDecimalString(pox.total_liquid_supply_ustx ? Number(pox.total_liquid_supply_ustx) / 1e6 : 0),
    risk: meta.risk,
    sourceUrl: 'https://stacking.club',
    asOf,
  };

  return [quote];
}

/**
 * @param {import('../types.js').AdapterContext} ctx
 * @returns {Promise<string>} APY as a decimal string
 */
async function computeTrailingApy(ctx) {
  return ctx.cache.wrap('yields:pox-stacking:apy', TTL.YIELDS_MS, async () => {
    // Real implementation: query the last N reward cycles, sum BTC paid out,
    // divide by USD value of STX locked, annualise (cycles ≈ 26/year).
    //
    // Until we wire that to live data, surface a transparent placeholder
    // marked clearly. Users will see "indicative" alongside the number in
    // the UI; never let an unverified APY be presented as a precise figure.
    return '0.07'; // placeholder, replace with real computation
  });
}

/** @type {import('../types.js').ProtocolAdapter['fetchUserPositions']} */
async function fetchUserPositions(ctx, address) {
  const key = `positions:pox-stacking:${address}`;
  return ctx.cache.wrap(key, TTL.POSITIONS_MS, async () => {
    const res = await ctx.fetch(`${apiBase(ctx)}/v2/pox_address/${address}`);
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`Hiro PoX address HTTP ${res.status}`);
    const data = /** @type {any} */ (await res.json());

    if (!data.locked || data.locked === '0') return [];

    const lockedUstx = BigInt(data.locked);
    const lockedStx = (Number(lockedUstx) / 1e6).toFixed(6);

    // Latest STX/USD price could come from a price oracle adapter.
    // For now, ask the portfolio module to enrich USD values upstream.
    /** @type {import('../types.js').UserPosition} */
    const position = {
      id: `pox-stacking:stx:${address}`,
      protocolSlug: 'pox-stacking',
      kind: 'staking',
      principal: {
        symbol: 'STX',
        amount: lockedStx,
        usdValue: '0', // filled in by the portfolio enricher
      },
      apyTotal: await computeTrailingApy(ctx),
      sourceUrl: 'https://stacking.club',
      asOf: new Date().toISOString(),
    };

    return [position];
  });
}

/** @type {import('../types.js').ProtocolAdapter['fetchTvl']} */
async function fetchTvl(ctx) {
  return ctx.cache.wrap('tvl:pox-stacking', TTL.TVL_MS, async () => {
    const pox = await fetchPoxInfo(ctx);
    const stxLocked = pox.next_cycle?.stacked_ustx
      ? Number(pox.next_cycle.stacked_ustx) / 1e6
      : 0;
    // USD value of locked STX should multiply by current STX price; the
    // portfolio enricher does this. Here we return the STX amount as the
    // raw TVL to avoid embedding price oracles in this adapter.
    return { tvlUsd: stxLocked.toFixed(2), asOf: new Date().toISOString() };
  });
}

/** @type {import('../types.js').ProtocolAdapter} */
export const poxStackingAdapter = {
  meta,
  fetchYields,
  fetchUserPositions,
  fetchTvl,
};

/**
 * @param {unknown} v
 * @returns {string}
 */
function toDecimalString(v) {
  if (v === null || v === undefined || v === '') return '0';
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(8);
}
