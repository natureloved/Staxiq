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

      // /v2/pox reports the cycle as current_cycle.id; cycle length is the sum
      // of the reward and prepare phases (no reward_cycle_length field exists).
      const cycleLength =
        (poxData.reward_phase_block_length || 2000) + (poxData.prepare_phase_block_length || 100);
      const blocksUntilNextCycle = poxData.next_cycle?.blocks_until_reward_phase ?? null;
      const cycleProgress = blocksUntilNextCycle != null
        ? Math.min(100, Math.max(0, Math.round(((cycleLength - blocksUntilNextCycle) / cycleLength) * 100)))
        : null;
      // Burnchain blocks arrive roughly every 10 minutes
      const nextCycleAt = blocksUntilNextCycle != null
        ? new Date(Date.now() + blocksUntilNextCycle * 10 * 60 * 1000).toISOString()
        : null;

      res.json({
        address,
        positions: allPositions,
        totalStackedSTX: totalStacked,
        networkApy,
        currentCycle: poxData.current_cycle?.id ?? null,
        rewardCycleLength: cycleLength,
        cycleProgress,
        blocksUntilNextCycle,
        nextCycleAt,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      ctx.log('stacking endpoint error', { err: String(e) });
      res.status(503).json({ error: 'data temporarily unavailable' });
    }
  });
}
