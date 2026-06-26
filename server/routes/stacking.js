import { getAdapter } from '../integrations/registry.js';

const HIRO_API_MAINNET = 'https://api.hiro.so';
const HIRO_API_TESTNET = 'https://api.testnet.hiro.so';

const STACKS_ADDRESS_RE = /^S[PMNT][0-9A-HJKMNP-Z]{26,39}$/;

function apiBase(network) {
  return network === 'testnet' ? HIRO_API_TESTNET : HIRO_API_MAINNET;
}

export function mountStackingRoutes(app, ctx) {
  app.get('/api/stacking/:address', async (req, res) => {
    const address = String(req.params.address || '');
    if (!STACKS_ADDRESS_RE.test(address)) {
      return res.status(400).json({ error: 'invalid stacks address' });
    }

    try {
      const poxAdapter = getAdapter('pox-stacking');
      const daoAdapter = getAdapter('stackingdao');

      const [poxPositions, daoPositions, poxYields] = await Promise.all([
        poxAdapter.fetchUserPositions(ctx, address),
        daoAdapter.fetchUserPositions(ctx, address),
        poxAdapter.fetchYields(ctx),
      ]);

      const poxRes = await ctx.fetch(`${apiBase(ctx.network)}/v2/pox`);
      const poxData = poxRes.ok ? await poxRes.json() : {};

      const allPositions = [...poxPositions, ...daoPositions];
      const totalStacked = allPositions.reduce((sum, p) => sum + parseFloat(p.principal.amount || '0'), 0);
      const networkApy = poxYields?.[0]?.apyTotal || '0.07';

      res.json({
        address,
        positions: allPositions,
        totalStackedSTX: totalStacked,
        networkApy,
        currentCycle: poxData.current_cycle?.cycle_number || null,
        rewardCycleLength: poxData.reward_cycle_length || 2100,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      ctx.log('stacking endpoint error', { err: String(e) });
      res.status(503).json({ error: 'data temporarily unavailable' });
    }
  });
}
