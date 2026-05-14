/**
 * @fileoverview Read-only routes — no wallet connection required.
 *
 * These endpoints power:
 *   - /research/:address  — paste any Stacks address, see portfolio + score
 *   - /protocols          — list all integrated protocols
 *   - /protocols/:slug    — public per-protocol page (data, risk, links)
 *   - /api/health         — system + cross-validation health
 *
 * Mount on the existing Express app:
 *
 *   import { mountReadOnlyRoutes } from './server/routes/readonly.js';
 *   mountReadOnlyRoutes(app, ctx);
 */

import { fanOut, getAllAdapters, getAdapter } from '../integrations/registry.js';
import { runCrossValidation } from '../integrations/crossval.js';
import { computeHealthScore } from '../healthScore/score.js';
import { buildSnapshot } from '../portfolio/snapshot.js';

const STACKS_ADDRESS_RE = /^S[PMNT][0-9A-HJKMNP-Z]{26,39}$/;

/**
 * @param {import('express').Express} app
 * @param {import('../integrations/types.js').AdapterContext} ctx
 */
export function mountReadOnlyRoutes(app, ctx) {
  // List all integrated protocols. Used for /protocols index page.
  app.get('/api/protocols', async (_req, res) => {
    const out = getAllAdapters().map((a) => a.meta);
    res.json({ protocols: out });
  });

  // Per-protocol public page data: meta + current yield offerings + TVL +
  // cross-validation status. Cacheable, SEO-friendly.
  app.get('/api/protocols/:slug', async (req, res) => {
    const adapter = getAdapter(req.params.slug);
    if (!adapter) return res.status(404).json({ error: 'unknown protocol' });
    try {
      const [yields, tvl] = await Promise.all([
        adapter.fetchYields(ctx),
        adapter.fetchTvl(ctx),
      ]);
      res.json({
        meta: adapter.meta,
        tvl,
        yields,
      });
    } catch (e) {
      ctx.log('protocol page error', { slug: req.params.slug, err: String(e) });
      res.status(503).json({ error: 'data temporarily unavailable', meta: adapter.meta });
    }
  });

  // Aggregated yield comparison — feeds the Yield Calculator.
  app.get('/api/yields', async (_req, res) => {
    const result = await fanOut((a) => a.fetchYields(ctx));
    res.json(result);
  });

  // Read-only portfolio for any Stacks address. No wallet required.
  app.get('/api/research/:address', async (req, res) => {
    const address = String(req.params.address || '');
    if (!STACKS_ADDRESS_RE.test(address)) {
      return res.status(400).json({ error: 'invalid stacks address' });
    }

    const positions = await fanOut((a) => a.fetchUserPositions(ctx, address));

    // Real snapshot — balances from Hiro, USD values from the price oracle,
    // USD backfilled on positions where adapters didn't supply them.
    const snap = await buildSnapshot(ctx, address, positions.ok);

    const health = computeHealthScore(snap);

    const upcoming = [
      { protocolSlug: 'zest', status: 'coming-soon', message: 'On-chain position reader landing in v0.3' },
      { protocolSlug: 'granite', status: 'coming-soon', message: 'On-chain position reader landing in v0.3' },
    ];

    res.json({
      address,
      totalUsd: snap.totalUsd,
      balances: snap.balances,
      positions: snap.positions,    // these are the priced versions now
      degraded: positions.errors,
      upcoming,
      health,
    });
  });

  // System health + cross-validation report. Public on purpose — this is
  // the "we publicly admit when our data drifts" surface.
  app.get('/api/health', async (_req, res) => {
    try {
      const reports = await runCrossValidation(ctx);
      res.json({
        ok: reports.every((r) => r.confidence !== 'fail'),
        reports,
        asOf: new Date().toISOString(),
      });
    } catch (e) {
      res.status(503).json({ ok: false, error: String(e) });
    }
  });
}
