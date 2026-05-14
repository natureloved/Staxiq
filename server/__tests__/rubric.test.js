import { describe, test, expect } from 'vitest';
import { RULES } from '../healthScore/rubric.js';
import { computeHealthScore } from '../healthScore/score.js';

/** Build a minimal valid portfolio snapshot. */
function snap(overrides = {}) {
  return {
    address: 'SP1234567890ABCDEFGHIJKLMNOPQRSTUVWX',
    totalUsd: '0',
    balances: [],
    positions: [],
    ...overrides,
  };
}

/** Build a minimal UserPosition. */
function pos(protocolSlug, usdValue, kind = 'lending', extra = {}) {
  return {
    id: `${protocolSlug}:stx:test`,
    protocolSlug,
    kind,
    principal: { symbol: 'STX', amount: '100', usdValue: String(usdValue) },
    apyTotal: '0.05',
    asOf: new Date().toISOString(),
    ...extra,
  };
}

// ─── concentrationRule ────────────────────────────────────────────────────────

const concentrationRule = RULES.find((r) => r.id === 'concentration');

describe('concentrationRule', () => {
  test('no positions → delta 0', () => {
    expect(concentrationRule.apply(snap()).delta).toBe(0);
  });

  test('100 % in one protocol → delta -20', () => {
    const s = snap({ positions: [pos('zest', 100)], totalUsd: '100' });
    expect(concentrationRule.apply(s).delta).toBe(-20);
  });

  test('71 % in one protocol → delta -12', () => {
    const s = snap({
      positions: [pos('zest', 71), pos('granite', 29)],
      totalUsd: '100',
    });
    expect(concentrationRule.apply(s).delta).toBe(-12);
  });

  test('50 % each → delta 0 (no penalty)', () => {
    const s = snap({
      positions: [pos('zest', 50), pos('granite', 50)],
      totalUsd: '100',
    });
    expect(concentrationRule.apply(s).delta).toBe(0);
  });
});

// ─── liquidationBufferRule ────────────────────────────────────────────────────

const liqRule = RULES.find((r) => r.id === 'liquidation-buffer');

describe('liquidationBufferRule', () => {
  test('no borrow positions → delta 0', () => {
    expect(liqRule.apply(snap()).delta).toBe(0);
  });

  test('health factor 1.1 (danger zone) → delta -25', () => {
    const s = snap({
      positions: [pos('zest', 100, 'borrowing', { healthFactor: '1.1' })],
      totalUsd: '100',
    });
    expect(liqRule.apply(s).delta).toBe(-25);
  });

  test('health factor 1.4 → delta -15', () => {
    const s = snap({
      positions: [pos('zest', 100, 'borrowing', { healthFactor: '1.4' })],
      totalUsd: '100',
    });
    expect(liqRule.apply(s).delta).toBe(-15);
  });

  test('health factor 2.5 → delta 0 (safe)', () => {
    const s = snap({
      positions: [pos('zest', 100, 'borrowing', { healthFactor: '2.5' })],
      totalUsd: '100',
    });
    expect(liqRule.apply(s).delta).toBe(0);
  });
});

// ─── idleCapitalRule ──────────────────────────────────────────────────────────

const idleRule = RULES.find((r) => r.id === 'idle-capital');

describe('idleCapitalRule', () => {
  test('empty wallet → delta 0', () => {
    expect(idleRule.apply(snap()).delta).toBe(0);
  });

  test('100 % idle → delta -10', () => {
    const s = snap({ totalUsd: '500', positions: [] });
    expect(idleRule.apply(s).delta).toBe(-10);
  });

  test('all deployed → delta 0', () => {
    const s = snap({
      totalUsd: '500',
      positions: [pos('zest', 500)],
    });
    expect(idleRule.apply(s).delta).toBe(0);
  });
});

// ─── assetDiversityRule ───────────────────────────────────────────────────────

const diversityRule = RULES.find((r) => r.id === 'asset-diversity');

describe('assetDiversityRule', () => {
  test('no meaningful holdings → delta 0', () => {
    expect(diversityRule.apply(snap()).delta).toBe(0);
  });

  test('holds BTC + STX + stablecoin → delta +5', () => {
    const s = snap({
      balances: [
        { symbol: 'sBTC', usdValue: '100' },
        { symbol: 'STX', usdValue: '100' },
        { symbol: 'USDA', usdValue: '100' },
      ],
    });
    expect(diversityRule.apply(s).delta).toBe(5);
  });

  test('only STX in positions → delta 0 (single asset type)', () => {
    const s = snap({
      positions: [pos('zest', 200)], // STX only
      totalUsd: '200',
    });
    expect(diversityRule.apply(s).delta).toBe(0);
  });

  test('sBTC supplied to Zest still counts as BTC exposure', () => {
    const sbtcPos = {
      id: 'zest:sbtc:test',
      protocolSlug: 'zest',
      kind: 'lending',
      principal: { symbol: 'sBTC', amount: '0.01', usdValue: '1000' },
      apyTotal: '0.04',
      asOf: new Date().toISOString(),
    };
    const s = snap({
      balances: [{ symbol: 'STX', usdValue: '200' }],
      positions: [sbtcPos],
    });
    // Has BTC (via position) + STX → 2 types → delta +2
    expect(diversityRule.apply(s).delta).toBe(2);
  });
});

// ─── computeHealthScore (integration) ────────────────────────────────────────

describe('computeHealthScore', () => {
  test('empty wallet scores 100 (no penalties, no deductions)', () => {
    const result = computeHealthScore(snap());
    expect(result.score).toBe(100);
    expect(result.breakdown).toHaveLength(RULES.length);
  });

  test('100 % concentration penalises the score', () => {
    const s = snap({ positions: [pos('zest', 500)], totalUsd: '500' });
    const result = computeHealthScore(s);
    expect(result.score).toBeLessThan(100);
  });

  test('score is clamped to 0–100', () => {
    // Artificially bad portfolio: 100 % concentration + critical liquidation
    const s = snap({
      totalUsd: '1000',
      positions: [
        pos('zest', 1000, 'borrowing', { healthFactor: '1.05' }),
      ],
    });
    const result = computeHealthScore(s);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test('rubricVersion is present', () => {
    expect(computeHealthScore(snap()).rubricVersion).toBeTruthy();
  });
});
