/**
 * @fileoverview Adapter registry — the only file that knows the full list
 * of integrated protocols. Routes and aggregators import `getAllAdapters()`
 * or `getAdapter(slug)` and never reach into adapters directly.
 *
 * To add a new protocol:
 *   1. Implement the ProtocolAdapter contract in ./adapters/<slug>.js
 *   2. Register it below.
 *   3. Add a logo to /public/logos/<slug>.svg.
 *   4. Add a row to docs/INTEGRATIONS.md describing risk + data sources.
 */

import { zestAdapter } from './adapters/zest.js';
import { poxStackingAdapter } from './adapters/poxStacking.js';

// As you implement these, uncomment + register. Stubbed so route handlers
// don't crash with "no adapters" during early development.
// import { graniteAdapter } from './adapters/granite.js';
// import { stackingDaoAdapter } from './adapters/stackingDao.js';
// import { bitflowAdapter } from './adapters/bitflow.js';
// import { alexAdapter } from './adapters/alex.js';
// import { hermeticaAdapter } from './adapters/hermetica.js';
// import { velarAdapter } from './adapters/velar.js';

/** @type {import('./types.js').ProtocolAdapter[]} */
const ADAPTERS = [
  zestAdapter,
  poxStackingAdapter,
  // graniteAdapter,
  // stackingDaoAdapter,
  // bitflowAdapter,
  // alexAdapter,
  // hermeticaAdapter,
  // velarAdapter,
];

/**
 * @returns {import('./types.js').ProtocolAdapter[]}
 */
export function getAllAdapters() {
  return ADAPTERS;
}

/**
 * @param {string} slug
 * @returns {import('./types.js').ProtocolAdapter | undefined}
 */
export function getAdapter(slug) {
  return ADAPTERS.find((a) => a.meta.slug === slug);
}

/**
 * Run an async function across all adapters, returning a PartialResult.
 * This is the primary "fan-out" used by aggregator endpoints — it never
 * lets one broken protocol take down the whole response.
 *
 * @template T
 * @param {(adapter: import('./types.js').ProtocolAdapter) => Promise<T[]>} fn
 * @returns {Promise<import('./types.js').PartialResult<T>>}
 */
export async function fanOut(fn) {
  const settled = await Promise.allSettled(ADAPTERS.map((a) => fn(a)));
  /** @type {T[]} */
  const ok = [];
  /** @type {Array<{ protocolSlug: string, error: string }>} */
  const errors = [];

  settled.forEach((res, i) => {
    const slug = ADAPTERS[i].meta.slug;
    if (res.status === 'fulfilled') {
      ok.push(...res.value);
    } else {
      errors.push({
        protocolSlug: slug,
        error: res.reason instanceof Error ? res.reason.message : String(res.reason),
      });
    }
  });

  return { ok, errors };
}
