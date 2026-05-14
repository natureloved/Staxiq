/**
 * @fileoverview Wallet balance fetcher.
 *
 * Pulls STX + SIP-010 fungible-token balances from the Hiro Stacks API and
 * resolves them through the token registry. Returns a flat list of
 * `{ symbol, amount, contractId? }` entries — the snapshot builder layers
 * USD values on top using the price oracle.
 *
 * Hiro endpoint:
 *   GET /extended/v1/address/{principal}/balances
 *
 * Response shape (abbreviated):
 *   {
 *     "stx": { "balance": "1234567" },                       // microSTX
 *     "fungible_tokens": {
 *       "<contract_address>.<contract_name>::<asset_name>": {
 *         "balance": "..."
 *       },
 *       ...
 *     }
 *   }
 *
 * Note: Hiro returns balances as raw integer strings in the token's smallest
 * unit. We convert to decimal here using the registered `decimals`. Tokens
 * not in the registry are logged once (so we can grow the registry over
 * time) and excluded from output.
 */

import { TTL } from '../integrations/cache.js';
import { STX_TOKEN, lookupToken } from './tokens.js';

const HIRO_API_MAINNET = 'https://api.hiro.so';
const HIRO_API_TESTNET = 'https://api.testnet.hiro.so';

/**
 * @typedef {Object} WalletBalance
 * @property {string} symbol
 * @property {string} amount       Decimal string (already scaled by decimals)
 * @property {string} [contractId] Hiro contract key (omitted for native STX)
 * @property {import('./tokens.js').TokenInfo['kind']} kind
 */

/**
 * @param {import('../integrations/types.js').AdapterContext} ctx
 */
function apiBase(ctx) {
  return ctx.network === 'mainnet' ? HIRO_API_MAINNET : HIRO_API_TESTNET;
}

/**
 * @param {import('../integrations/types.js').AdapterContext} ctx
 * @param {string} address
 * @returns {Promise<WalletBalance[]>}
 */
export async function fetchBalances(ctx, address) {
  return ctx.cache.wrap(`balances:${address}`, TTL.POSITIONS_MS, async () => {
    const url = `${apiBase(ctx)}/extended/v1/address/${encodeURIComponent(address)}/balances`;
    const res = await ctx.fetch(url);
    if (!res.ok) throw new Error(`Hiro balances HTTP ${res.status}`);
    const data = /** @type {any} */ (await res.json());

    /** @type {WalletBalance[]} */
    const out = [];

    // 1. Native STX. Hiro reports microSTX as a string.
    const microStx = data?.stx?.balance ?? '0';
    const stxAmount = scaleDown(microStx, STX_TOKEN.decimals);
    if (Number(stxAmount) > 0) {
      out.push({
        symbol: STX_TOKEN.symbol,
        amount: stxAmount,
        kind: STX_TOKEN.kind,
      });
    }

    // 2. SIP-010 fungible tokens.
    const fts = /** @type {Record<string, { balance: string }>} */ (
      data?.fungible_tokens ?? {}
    );

    /** @type {Set<string>} unknown contract keys we've already logged */
    const loggedUnknowns = new Set();

    for (const [hiroKey, bal] of Object.entries(fts)) {
      const info = lookupToken(hiroKey, ctx.network);
      if (!info) {
        // Log the unknown contract once per response so we can grow the
        // registry over time. Don't crash, don't include in totalUsd.
        const contractKey = hiroKey.split('::')[0];
        if (!loggedUnknowns.has(contractKey)) {
          loggedUnknowns.add(contractKey);
          ctx.log('balances: unknown SIP-010 token (skipped)', { contractKey });
        }
        continue;
      }

      const amount = scaleDown(bal?.balance ?? '0', info.decimals);
      if (Number(amount) <= 0) continue; // skip zero balances

      out.push({
        symbol: info.symbol,
        amount,
        contractId: hiroKey.split('::')[0],
        kind: info.kind,
      });
    }

    return out;
  });
}

/**
 * Convert a raw integer string in smallest units to a decimal string.
 * Pure string math via BigInt to avoid float drift on large balances
 * (e.g. 100000000000 sats / 1e8 = 1000.00000000 sBTC, not 999.99999).
 *
 * @param {string} rawIntString
 * @param {number} decimals
 * @returns {string}
 */
function scaleDown(rawIntString, decimals) {
  if (typeof rawIntString !== 'string' || rawIntString === '') return '0';
  let s = rawIntString.trim();
  if (s.startsWith('-')) return '0'; // negative balances make no sense; treat as zero
  if (decimals <= 0) return s;

  // Pad with leading zeros so the slice is well-defined.
  if (s.length <= decimals) {
    s = s.padStart(decimals + 1, '0');
  }
  const whole = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

export const __testing = { scaleDown };
