/**
 * @fileoverview Adapter contract for protocol integrations.
 *
 * Every protocol (Zest, Granite, StackingDAO, Bitflow, Alex, Hermetica, Velar,
 * native PoX stacking, etc.) implements this contract. The aggregator only
 * talks to adapters — never to protocol SDKs or RPCs directly. This keeps
 * protocol-specific quirks isolated and makes the system testable.
 *
 * Design principles:
 *   1. Adapters are stateless — they receive a ctx (network, fetcher, cache).
 *   2. Every method is allowed to fail; callers must handle PartialResult.
 *   3. Numbers are returned as strings (or bigint) to avoid float drift.
 *   4. APYs are decimals (0.0421 = 4.21%), never percentages.
 *   5. Every yield datum carries a `source` and `asOf` for transparency.
 */

/**
 * @typedef {'mainnet' | 'testnet'} StacksNetwork
 */

/**
 * @typedef {Object} AdapterContext
 * @property {StacksNetwork} network
 * @property {(url: string, init?: RequestInit) => Promise<Response>} fetch
 * @property {import('./cache.js').Cache} cache
 * @property {(msg: string, meta?: object) => void} log
 */

/**
 * @typedef {'lending' | 'borrowing' | 'liquidity' | 'staking' | 'vault' | 'stablecoin'} PositionKind
 */

/**
 * @typedef {Object} TokenAmount
 * @property {string} symbol           e.g. 'sBTC', 'STX', 'USDh'
 * @property {string} amount           Decimal string, e.g. '0.42153'
 * @property {string} usdValue         Decimal string, e.g. '36420.11'
 * @property {string} [contractId]     Stacks contract id if SIP-010 token
 */

/**
 * @typedef {Object} YieldQuote
 * Shape of a single yield offering surfaced by the protocol.
 * Used by the Yield Calculator and Protocol Comparison views.
 *
 * @property {string} id                e.g. 'zest:sbtc-supply'
 * @property {string} protocolSlug      e.g. 'zest'
 * @property {string} label             e.g. 'Supply sBTC'
 * @property {PositionKind} kind
 * @property {string} asset             Symbol the user deposits, e.g. 'sBTC'
 * @property {string} apyBase           Decimal string, base APY (no rewards)
 * @property {string} [apyReward]       Decimal string, additional reward APY
 * @property {string} apyTotal          Decimal string, base + reward
 * @property {string} tvlUsd            Decimal string
 * @property {RiskFlags} risk
 * @property {string} sourceUrl         Public link the user can verify
 * @property {string} asOf              ISO-8601 timestamp
 */

/**
 * @typedef {Object} RiskFlags
 * @property {'low' | 'medium' | 'high'} smartContract  Audit + age based
 * @property {boolean} hasLiquidationRisk
 * @property {boolean} hasImpermanentLoss
 * @property {boolean} hasCustodyRisk    True for wrapped-BTC products that
 *                                       hold real BTC in a federation/MPC
 * @property {string} [notes]
 */

/**
 * @typedef {Object} UserPosition
 * Detected on-chain position for a given address in a given protocol.
 *
 * @property {string} id                  e.g. 'zest:sbtc-supply:SP123...'
 * @property {string} protocolSlug
 * @property {PositionKind} kind
 * @property {TokenAmount} principal      What the user deposited / supplied
 * @property {TokenAmount} [debt]         For borrow positions
 * @property {TokenAmount} [rewards]      Unclaimed rewards
 * @property {string} [healthFactor]      For lend/borrow; >1 = safe, 1 = liquidation
 * @property {string} apyTotal            Decimal string, current APY on this position
 * @property {string} sourceUrl           Where the user can manage / exit
 * @property {string} asOf                ISO-8601 timestamp
 */

/**
 * @typedef {Object} ProtocolMeta
 * Static-ish info about a protocol; used for the public protocol pages.
 *
 * @property {string} slug
 * @property {string} name
 * @property {string} url
 * @property {string} category           Human-readable, e.g. 'Lending market'
 * @property {string[]} kinds            Position kinds this protocol offers
 * @property {string} [auditUrl]
 * @property {string} [defillamaSlug]    For TVL cross-validation
 * @property {string} [docsUrl]
 * @property {RiskFlags} risk
 * @property {string} [logo]
 */

/**
 * @template T
 * @typedef {Object} PartialResult
 * Adapters return PartialResult instead of throwing. The aggregator can show
 * partial data and surface which protocols are degraded.
 *
 * @property {T[]} ok
 * @property {Array<{ protocolSlug: string, error: string }>} errors
 */

/**
 * @typedef {Object} ProtocolAdapter
 *
 * @property {ProtocolMeta} meta
 *
 * @property {(ctx: AdapterContext) => Promise<YieldQuote[]>} fetchYields
 *   Return all yield offerings this protocol currently exposes.
 *
 * @property {(ctx: AdapterContext, address: string) => Promise<UserPosition[]>} fetchUserPositions
 *   Return all positions held by `address` in this protocol. Should return
 *   [] (not throw) when the user has no position.
 *
 * @property {(ctx: AdapterContext) => Promise<{ tvlUsd: string, asOf: string }>} fetchTvl
 *   Best-effort current TVL. Used for cross-validation against DefiLlama.
 */

export {}; // makes this a module so JSDoc imports resolve
