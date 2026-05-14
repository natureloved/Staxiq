/**
 * @fileoverview TTL cache for adapter responses.
 *
 * Two-tier strategy:
 *   - In-memory (Map) for hot reads inside a single Node process.
 *   - Redis adapter (optional, env-gated) for shared cache across instances.
 *
 * Adapters never call this directly with raw protocol responses — they wrap
 * their fetch in `cache.wrap(key, ttlMs, fn)`. This keeps the cache key
 * surface area small and auditable.
 *
 * Conventions for keys:
 *   yields:<protocolSlug>
 *   tvl:<protocolSlug>
 *   positions:<protocolSlug>:<address>
 *   defillama:<protocolSlug>
 */

/**
 * @typedef {Object} Cache
 * @property {<T>(key: string, ttlMs: number, fn: () => Promise<T>) => Promise<T>} wrap
 * @property {(key: string) => Promise<void>} invalidate
 * @property {(prefix: string) => Promise<void>} invalidatePrefix
 */

/**
 * Build an in-memory cache. Suitable for single-instance deployments and
 * for local dev. For production, pair this with a Redis-backed cache layered
 * in front (or swap the implementation behind the same interface).
 *
 * @returns {Cache}
 */
export function createMemoryCache() {
  /** @type {Map<string, { value: unknown, expiresAt: number }>} */
  const store = new Map();

  /** @type {Map<string, Promise<unknown>>} in-flight de-duplication */
  const inflight = new Map();

  return {
    async wrap(key, ttlMs, fn) {
      const now = Date.now();
      const hit = store.get(key);
      if (hit && hit.expiresAt > now) {
        // @ts-expect-error generic erased
        return hit.value;
      }

      // Coalesce concurrent fetches for the same key — a thundering herd of
      // parallel requests during a cold cache should not stampede the RPC.
      const existing = inflight.get(key);
      if (existing) {
        // @ts-expect-error generic erased
        return existing;
      }

      const promise = (async () => {
        try {
          const value = await fn();
          store.set(key, { value, expiresAt: Date.now() + ttlMs });
          return value;
        } finally {
          inflight.delete(key);
        }
      })();

      inflight.set(key, promise);
      return promise;
    },

    async invalidate(key) {
      store.delete(key);
    },

    async invalidatePrefix(prefix) {
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    },
  };
}

/**
 * Sensible default TTLs. Tuned to the volatility of each data type.
 * APYs change minute-to-minute on busy markets; TVL is slower; positions
 * should be near-real-time but cache briefly to absorb refresh bursts.
 */
export const TTL = Object.freeze({
  YIELDS_MS: 60_000,         // 1 minute
  TVL_MS: 5 * 60_000,        // 5 minutes
  POSITIONS_MS: 20_000,      // 20 seconds
  DEFILLAMA_MS: 10 * 60_000, // 10 minutes — their cache is already long
});
