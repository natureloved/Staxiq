/**
 * @fileoverview SIP-010 token registry.
 *
 * Maps Stacks fungible-token contract IDs to (symbol, decimals, kind). The
 * registry is intentionally small and explicit rather than dynamically
 * resolved from chain metadata — chain metadata is occasionally wrong or
 * stale, and a token aggregator's reputation depends on showing the right
 * symbol next to the right number.
 *
 * What goes in the registry:
 *   - "tier 1" tokens: sBTC, stablecoins, STX (handled separately as the
 *     native asset), liquid-staked variants (stSTX).
 *   - The contract IDs here are MAINNET. For testnet, the route handler
 *     should branch on `ctx.network`.
 *
 * What stays out of the registry:
 *   - Receipt tokens (zSBTC, aTokens, etc.). These represent positions, not
 *     standalone balances. Including them would double-count, since the
 *     same value already shows up as a `UserPosition` from the protocol's
 *     adapter.
 *   - Long-tail SIP-010 tokens. Unknown tokens are logged (so we can add
 *     them to the registry over time) but excluded from totalUsd to avoid
 *     pricing things we don't have a reliable USD source for.
 *
 * VERIFICATION: contract IDs below are the best public values as of writing.
 * Before deploying, cross-check each one against the official protocol docs.
 * A wrong ID will silently fail to resolve a balance (zero shown instead of
 * real value) — bad UX but not a security issue.
 */

/**
 * @typedef {Object} TokenInfo
 * @property {string} symbol
 * @property {number} decimals
 * @property {'native' | 'btc-pegged' | 'stablecoin' | 'lst' | 'governance'} kind
 * @property {string} [name]
 * @property {string} [verifyUrl]   Where to confirm the contract ID is current
 */

/**
 * Native STX is not a SIP-010 contract; it's reported separately by the
 * Hiro balances endpoint under `stx.balance`. Kept here so price + display
 * code can treat all assets uniformly.
 *
 * @type {TokenInfo}
 */
export const STX_TOKEN = {
  symbol: 'STX',
  decimals: 6,
  kind: 'native',
  name: 'Stacks',
};

/**
 * SIP-010 contract registry, keyed by `${contractAddress}.${contractName}`
 * (NOT including the asset name suffix that Hiro returns — see
 * `parseContractKey` in balances.js for how those are normalised).
 *
 * @type {Record<string, TokenInfo>}
 */
export const SIP010_REGISTRY_MAINNET = {
  // Bitcoin-pegged
  'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token': {
    symbol: 'sBTC',
    decimals: 8,
    kind: 'btc-pegged',
    name: 'sBTC',
    verifyUrl: 'https://docs.stacks.co/concepts/sbtc',
  },

  // Stablecoins — symbol must match what STABLECOIN_SYMBOLS in prices.js pins to $1
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.aeusdc': {
    symbol: 'aeUSDC',
    decimals: 6,
    kind: 'stablecoin',
    name: 'Allbridge-bridged USDC',
    verifyUrl: 'https://docs.granite.world',
  },
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token': {
    symbol: 'USDA',
    decimals: 6,
    kind: 'stablecoin',
    name: 'Arkadiko USDA',
    verifyUrl: 'https://docs.arkadiko.finance',
  },
  // USDh (Hermetica) — verify the canonical contract ID at https://hermetica.fi
  // before enabling. Comment out rather than ship a guess.
  // 'SP<...>.usdh-token': {
  //   symbol: 'USDh',
  //   decimals: 8,
  //   kind: 'stablecoin',
  //   name: 'Hermetica USDh',
  // },

  // Liquid-stacked STX
  'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token': {
    symbol: 'stSTX',
    decimals: 6,
    kind: 'lst',
    name: 'StackingDAO stSTX',
    verifyUrl: 'https://stackingdao.com',
  },
};

/**
 * Testnet token registry. Add testnet contract IDs here when you need
 * testnet research-mode to resolve balances. Intentionally empty by
 * default — testnet research mode degrades gracefully (no priced balances)
 * unless you add the specific contracts you need for local dev.
 *
 * @type {Record<string, TokenInfo>}
 */
export const SIP010_REGISTRY_TESTNET = {
  // Testnet sBTC — verify at https://docs.stacks.co/concepts/sbtc/testnet
  // 'ST<contract_address>.sbtc-token': { symbol: 'sBTC', decimals: 8, kind: 'btc-pegged' },
};

/**
 * Look up a token by its full Hiro-API key, e.g.
 *   `SM3...J4.sbtc-token::sbtc`
 * The trailing `::asset_name` is stripped before lookup.
 *
 * @param {string} hiroKey
 * @param {'mainnet' | 'testnet'} network
 * @returns {TokenInfo | null}
 */
export function lookupToken(hiroKey, network = 'mainnet') {
  const registry = network === 'testnet' ? SIP010_REGISTRY_TESTNET : SIP010_REGISTRY_MAINNET;
  const contractKey = hiroKey.split('::')[0];
  return registry[contractKey] ?? null;
}

/**
 * Symbols of all stablecoins in the registry. Used by the price oracle to
 * decide which symbols to pin to $1.
 *
 * @returns {string[]}
 */
export function stablecoinSymbols() {
  /** @type {Set<string>} */
  const set = new Set();
  for (const t of Object.values(SIP010_REGISTRY_MAINNET)) {
    if (t.kind === 'stablecoin') set.add(t.symbol);
  }
  return [...set];
}
