/**
 * @fileoverview TTL cache for adapter responses.
 *
 * Three-tier strategy:
 *   - In-memory (Map) for hot reads inside a single Node process.
 *   - Upstash Redis (optional, env-gated) for shared cache across instances.
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
 *
 * Enable Redis by setting UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */

/**
 * @typedef {Object} Cache
 * @property {<T>(key: string, ttlMs: number, fn: () => Promise<T>) => Promise<T>} wrap
 * @property {(key: string) => Promise<void>} invalidate
 * @property {(prefix: string) => Promise<void>} invalidatePrefix
 */

/**
 * Build a two-tier cache: L1 in-memory + L2 Upstash Redis (optional).
 * If Redis env vars are not set, falls back to in-memory only.
 *
 * @param {import('./types.js').AdapterContext} [ctx] Optional context with fetch
 * @returns {Cache}
 */
export function createMemoryCache(ctx) {
  /** @type {Map<string, { value: unknown, expiresAt: number }>} */
  const l1 = new Map();

  /** @type {Map<string, Promise<unknown>>} in-flight de-duplication */
  const inflight = new Map();

  // Optional L2 Redis via Upstash
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const hasRedis = Boolean(upstashUrl && upstashToken);
  const redisFetch = ctx?.fetch || ((url, init) => fetch(url, init));

  async function redisGet(key) {
    if (!hasRedis) return null;
    try {
      const res = await redisFetch(`${upstashUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.result ?? null;
    } catch {
      return null;
    }
  }

  async function redisSet(key, value, ttlMs) {
    if (!hasRedis) return;
    try {
      const ttlSec = Math.ceil(ttlMs / 1000);
      await redisFetch(`${upstashUrl}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: JSON.stringify(value), ex: ttlSec }),
      });
    } catch {
      // non-fatal — L1 still serves
    }
  }

  async function redisDel(key) {
    if (!hasRedis) return;
    try {
      await redisFetch(`${upstashUrl}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${upstashToken}` },
      });
    } catch {
      // non-fatal
    }
  }

  return {
    async wrap(key, ttlMs, fn) {
      const now = Date.now();

      // L1 check
      const l1Hit = l1.get(key);
      if (l1Hit && l1Hit.expiresAt > now) {
        return l1Hit.value;
      }

      // L2 check (Redis)
      const redisRaw = await redisGet(key);
      if (redisRaw !== null) {
        try {
          const value = JSON.parse(redisRaw);
          l1.set(key, { value, expiresAt: now + ttlMs });
          return value;
        } catch {
          // corrupted cache entry — fall through to fetch
        }
      }

      // Thundering herd dedup — coalesce concurrent fetches for same key
      const existing = inflight.get(key);
      if (existing) {
        return existing;
      }

      const promise = (async () => {
        try {
          const value = await fn();
          l1.set(key, { value, expiresAt: now + ttlMs });
          await redisSet(key, value, ttlMs);
          return value;
        } finally {
          inflight.delete(key);
        }
      })();

      inflight.set(key, promise);
      return promise;
    },

    async invalidate(key) {
      l1.delete(key);
      await redisDel(key);
    },

    async invalidatePrefix(prefix) {
      for (const key of [...l1.keys()]) {
        if (key.startsWith(prefix)) {
          l1.delete(key);
          await redisDel(key);
        }
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
