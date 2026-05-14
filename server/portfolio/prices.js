/**
 * @fileoverview Price oracle adapter.
 *
 * Strategy:
 *   1. STX, BTC: fetch from CoinGecko (free tier, well-known IDs).
 *   2. sBTC: assume 1:1 with BTC. By design sBTC is fully Bitcoin-backed; if
 *      it ever depegs, we should detect it explicitly and surface the depeg
 *      rather than silently use a different price.
 *   3. Stablecoins: pinned to $1.00. A future improvement would consult
 *      Pyth feeds (Granite already integrates Pyth on Stacks) to detect
 *      stablecoin depegs in real time and surface them.
 *
 * The `getPrices` function batches lookups into a single CoinGecko call,
 * caches aggressively (5 min TTL — prices don't move that much in
 * aggregator-time), and degrades to last-known-good on transient failures.
 *
 * Reference: https://docs.coingecko.com/reference/simple-price
 */

import { TTL } from '../integrations/cache.js';
import { stablecoinSymbols } from './tokens.js';

const COINGECKO_BASE = process.env.COINGECKO_BASE ?? 'https://api.coingecko.com/api/v3';

/**
 * Map of our internal symbols → CoinGecko coin IDs. Anything not in this
 * map is either a stablecoin (pinned to $1), pegged to something that is
 * (sBTC → BTC), or unknown (we return null and the caller decides what to do).
 */
const COINGECKO_IDS = {
  STX: 'blockstack',
  BTC: 'bitcoin',
};

/**
 * @param {string} symbol
 * @returns {string}   The symbol whose CoinGecko price should drive this one
 */
function priceSourceFor(symbol) {
  // sBTC is 1:1 BTC by construction. If/when depeg detection lands, this
  // becomes a real lookup; until then, route to BTC.
  if (symbol === 'sBTC') return 'BTC';
  return symbol;
}

/**
 * Fetch USD prices for the given symbols. Always returns a map; symbols
 * we couldn't price are simply omitted (caller treats missing as "skip
 * USD calculation for this asset" rather than $0).
 *
 * @param {import('../integrations/types.js').AdapterContext} ctx
 * @param {string[]} symbols
 * @returns {Promise<Record<string, string>>}   { 'STX': '0.421500', ... }
 */
export async function getPrices(ctx, symbols) {
  const stables = new Set(stablecoinSymbols());
  /** @type {Record<string, string>} */
  const out = {};

  // 1. Pin stablecoins immediately.
  for (const s of symbols) {
    if (stables.has(s)) out[s] = '1.00';
  }

  // 2. Resolve which CoinGecko IDs we need.
  /** @type {Set<string>} */
  const cgIds = new Set();
  for (const s of symbols) {
    const source = priceSourceFor(s);
    const id = COINGECKO_IDS[source];
    if (id) cgIds.add(id);
  }
  if (cgIds.size === 0) return out;

  // 3. Single batched CoinGecko call, cached.
  const idsKey = [...cgIds].sort().join(',');
  const prices = await ctx.cache.wrap(`prices:cg:${idsKey}`, TTL.TVL_MS, async () => {
    const url = `${COINGECKO_BASE}/simple/price?ids=${encodeURIComponent(idsKey)}&vs_currencies=usd`;
    const res = await ctx.fetch(url);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    return /** @type {Record<string, { usd?: number }>} */ (await res.json());
  }).catch((err) => {
    // Don't take the whole portfolio response down because of a price API
    // hiccup. Log and degrade — the route handler will surface "USD
    // unavailable for some assets" rather than 5xx.
    ctx.log('prices: coingecko fetch failed', { err: String(err) });
    return /** @type {Record<string, { usd?: number }>} */ ({});
  });

  // 4. Map back to internal symbols.
  for (const s of symbols) {
    if (out[s]) continue; // stablecoin already pinned
    const source = priceSourceFor(s);
    const id = COINGECKO_IDS[source];
    if (!id) continue;
    const usd = prices[id]?.usd;
    if (typeof usd === 'number' && Number.isFinite(usd) && usd > 0) {
      out[s] = usd.toFixed(8);
    }
  }

  return out;
}

/**
 * Multiply a token amount by its USD price, returning a fixed-2 string.
 * Returns '0' if either input is missing or invalid — never NaN, never
 * Infinity.
 *
 * @param {string} amount
 * @param {string | undefined} price
 * @returns {string}
 */
export function multiplyToUsd(amount, price) {
  if (!price) return '0';
  const a = Number(amount);
  const p = Number(price);
  if (!Number.isFinite(a) || !Number.isFinite(p)) return '0';
  return (a * p).toFixed(2);
}
