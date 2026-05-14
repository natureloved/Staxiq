/**
 * @fileoverview Cross-validation against DefiLlama.
 *
 * Why this exists: a yield aggregator is only as trustworthy as its data.
 * If Staxiq's number for Zest disagrees by 10% with the canonical
 * third-party reference (DefiLlama), users will rightly distrust everything.
 *
 * For every protocol with a `defillamaSlug`, we fetch DefiLlama's TVL and
 * compare it to our own. The diff (and which side is fresher) is exposed
 * via the /api/health endpoint and rendered as a small "data confidence"
 * indicator next to each protocol.
 *
 * This is a STRONG trust signal — we publicly admit when our data drifts
 * from the canonical source. That's how you get taken seriously by
 * institutional users.
 */

import { TTL } from './cache.js';
import { getAllAdapters } from './registry.js';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const DRIFT_WARN_PCT = 0.05; // 5% — inside this, we trust our number
const DRIFT_FAIL_PCT = 0.20; // 20% — outside this, we mark protocol as DEGRADED

/**
 * @typedef {'ok' | 'warn' | 'fail' | 'unknown' | 'self-sourced'} DataConfidence
 */

/**
 * @typedef {Object} CrossValidationReport
 * @property {string} protocolSlug
 * @property {string | null} ourTvlUsd
 * @property {string | null} llamaTvlUsd
 * @property {number | null} driftPct       Signed: positive = we're higher
 * @property {DataConfidence} confidence
 * @property {string} asOf
 */

/**
 * @param {import('./types.js').AdapterContext} ctx
 * @param {string} slug
 */
async function fetchLlamaTvl(ctx, slug) {
  return ctx.cache.wrap(`defillama:${slug}`, TTL.DEFILLAMA_MS, async () => {
    const res = await ctx.fetch(`${DEFILLAMA_BASE}/tvl/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data === 'number') return Number(data).toFixed(2);
    return null;
  });
}

/**
 * @param {import('./types.js').AdapterContext} ctx
 * @returns {Promise<CrossValidationReport[]>}
 */
export async function runCrossValidation(ctx) {
  const adapters = getAllAdapters();
  const reports = await Promise.all(
    adapters.map(async (adapter) => {
      /** @type {CrossValidationReport} */
      const base = {
        protocolSlug: adapter.meta.slug,
        ourTvlUsd: null,
        llamaTvlUsd: null,
        driftPct: null,
        confidence: 'unknown',
        asOf: new Date().toISOString(),
      };

      try {
        const ours = await adapter.fetchTvl(ctx);
        base.ourTvlUsd = ours.tvlUsd;
      } catch (e) {
        ctx.log('crossval: own tvl failed', { slug: adapter.meta.slug, err: String(e) });
        base.confidence = 'fail';
        return base;
      }

      if (!adapter.meta.defillamaSlug) {
        // No external reference is available (e.g. native PoX stacking).
        // We mark these `unknown` so the UI can show "no third-party
        // reference available" rather than implying we've been verified.
        return base;
      }

      if (adapter.meta.tvlSource === 'defillama') {
        base.confidence = 'self-sourced';
        base.llamaTvlUsd = base.ourTvlUsd;
        return base;
      }

      try {
        base.llamaTvlUsd = await fetchLlamaTvl(ctx, adapter.meta.defillamaSlug);
      } catch (e) {
        ctx.log('crossval: llama tvl failed', { slug: adapter.meta.slug, err: String(e) });
      }

      if (base.ourTvlUsd && base.llamaTvlUsd) {
        const ours = Number(base.ourTvlUsd);
        const llama = Number(base.llamaTvlUsd);
        if (llama > 0) {
          base.driftPct = (ours - llama) / llama;
          const abs = Math.abs(base.driftPct);
          if (abs > DRIFT_FAIL_PCT) base.confidence = 'fail';
          else if (abs > DRIFT_WARN_PCT) base.confidence = 'warn';
          else base.confidence = 'ok';
        }
      }

      return base;
    })
  );

  return reports;
}

export const CROSS_VAL_THRESHOLDS = {
  WARN: DRIFT_WARN_PCT,
  FAIL: DRIFT_FAIL_PCT,
};
