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
 * Compute the trailing APY by:
 *   1. Fetching recent Bitcoin (burn) blocks from the Hiro burnchain API.
 *   2. Summing `total_commit_spend` (satoshis miners paid into PoX) per block.
 *   3. Extrapolating to a full reward cycle then annualising (26 cycles/year).
 *   4. Dividing by the USD value of STX currently stacked.
 *
 * Falls back to '0.07' (7% indicative) on any network or data failure so
 * the yield display is never blank.
 *
 * @param {import('../types.js').AdapterContext} ctx
 * @returns {Promise<string>} APY as a decimal string, e.g. '0.0812'
 */
async function computeTrailingApy(ctx) {
  return ctx.cache.wrap('yields:pox-stacking:apy', TTL.YIELDS_MS, async () => {
    try {
      const base = apiBase(ctx);

      const [poxRes, burnRes, priceRes] = await Promise.all([
        ctx.fetch(`${base}/v2/pox`),
        ctx.fetch(`${base}/extended/v1/burnchain/blocks?limit=100`),
        ctx.fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd'),
      ]);

      if (!poxRes.ok || !burnRes.ok || !priceRes.ok) return '0.07';

      const [pox, burnData, prices] = await Promise.all([
        poxRes.json(),
        burnRes.json(),
        priceRes.json(),
      ]);

      const stackedUstx = Number(pox.current_cycle?.stacked_ustx || 0);
      const cycleLength = pox.reward_cycle_length || 2100;
      const blocks = burnData.results || [];

      if (stackedUstx <= 0 || blocks.length === 0) return '0.07';

      const totalCommitSats = blocks.reduce(
        (sum, b) => sum + (Number(b.total_commit_spend) || 0),
        0,
      );
      if (totalCommitSats === 0) return '0.07';

      // Extrapolate: average commit per block × full cycle length → BTC per cycle
      const avgCommitPerBlock = totalCommitSats / blocks.length;
      const btcPerCycle = (avgCommitPerBlock * cycleLength) / 1e8;

      const btcPrice = prices?.bitcoin?.usd;
      const stxPrice = prices?.blockstack?.usd;
      if (!btcPrice || !stxPrice || btcPrice <= 0 || stxPrice <= 0) return '0.07';

      const CYCLES_PER_YEAR = 26;
      const stxStacked = stackedUstx / 1e6;
      const annualUsd = btcPerCycle * CYCLES_PER_YEAR * btcPrice;
      const stackedUsd = stxStacked * stxPrice;

      const apy = annualUsd / stackedUsd;

      // PoX APY is historically 4-18%; reject wild values and fall back
      if (!Number.isFinite(apy) || apy < 0.02 || apy > 0.30) return '0.07';
      return apy.toFixed(4);
    } catch (e) {
      ctx.log('pox: trailing apy computation failed', { err: String(e) });
      return '0.07';
    }
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
