/**
 * @fileoverview Wallet Health Score rubric.
 *
 * Replaces the opaque "proprietary algorithm" with an explainable rubric.
 * Every rule:
 *   - Has a stable id, a human title, and a max point delta.
 *   - Is pure: takes a portfolio snapshot, returns { delta, evidence }.
 *   - Is documented in /docs/HEALTH_SCORE.md with rationale and source.
 *
 * Rules are versioned so we can ship improvements without invalidating
 * historical scores. UI displays the rubric version next to the score.
 */

export const RUBRIC_VERSION = '0.1.0';

const BASE_SCORE = 100;

/**
 * @typedef {Object} PortfolioSnapshot
 * @property {string} address
 * @property {string} totalUsd
 * @property {Array<{ symbol: string, usdValue: string }>} balances
 * @property {import('../integrations/types.js').UserPosition[]} positions
 */

/**
 * @typedef {Object} RuleEvidence
 * @property {string} message       Plain-English explanation shown to the user
 * @property {object} [meta]        Numbers backing the explanation
 */

/**
 * @typedef {Object} RuleResult
 * @property {string} ruleId
 * @property {string} title
 * @property {number} delta         Signed score change (negative = penalty)
 * @property {number} maxAbsDelta   Max possible magnitude for this rule
 * @property {RuleEvidence} evidence
 */

/**
 * @typedef {Object} Rule
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} maxAbsDelta   Used for normalising and capping
 * @property {(snap: PortfolioSnapshot) => RuleResult} apply
 */

// ---------- Concentration risk ----------

/** @type {Rule} */
const concentrationRule = {
  id: 'concentration',
  title: 'Protocol concentration',
  description:
    'Penalises portfolios where >50% of value sits in a single protocol. ' +
    'A single smart-contract failure should not be able to wipe out the user.',
  maxAbsDelta: 20,
  apply(snap) {
    const totals = new Map();
    let positionsTotal = 0;
    for (const p of snap.positions) {
      const v = Number(p.principal.usdValue);
      totals.set(p.protocolSlug, (totals.get(p.protocolSlug) ?? 0) + v);
      positionsTotal += v;
    }
    if (positionsTotal === 0) {
      return ruleZero(this, 'No protocol positions detected.');
    }
    let topShare = 0;
    let topSlug = '';
    for (const [slug, v] of totals) {
      const share = v / positionsTotal;
      if (share > topShare) { topShare = share; topSlug = slug; }
    }
    let delta = 0;
    if (topShare > 0.9) delta = -20;
    else if (topShare > 0.7) delta = -12;
    else if (topShare > 0.5) delta = -6;

    return {
      ruleId: this.id,
      title: this.title,
      delta,
      maxAbsDelta: this.maxAbsDelta,
      evidence: {
        message: delta === 0
          ? `Diversified across protocols (top: ${topSlug} at ${pct(topShare)}).`
          : `${pct(topShare)} concentrated in ${topSlug}.`,
        meta: { topShare, topSlug },
      },
    };
  },
};

// ---------- Liquidation buffer ----------

/** @type {Rule} */
const liquidationBufferRule = {
  id: 'liquidation-buffer',
  title: 'Liquidation buffer',
  description:
    'Penalises borrow positions with health factor < 2.0 (industry rule of ' +
    'thumb for sBTC volatility). Health factor of 1.0 means imminent liquidation.',
  maxAbsDelta: 25,
  apply(snap) {
    const borrows = snap.positions.filter((p) => p.kind === 'borrowing' && p.healthFactor);
    if (borrows.length === 0) {
      return ruleZero(this, 'No borrow positions — no liquidation risk to evaluate.');
    }
    let worstHf = Infinity;
    let worstSource = '';
    for (const b of borrows) {
      const hf = Number(b.healthFactor);
      if (hf < worstHf) { worstHf = hf; worstSource = b.protocolSlug; }
    }
    let delta = 0;
    if (worstHf < 1.2) delta = -25;
    else if (worstHf < 1.5) delta = -15;
    else if (worstHf < 2.0) delta = -8;

    return {
      ruleId: this.id,
      title: this.title,
      delta,
      maxAbsDelta: this.maxAbsDelta,
      evidence: {
        message: delta === 0
          ? `Healthy buffer (lowest HF ${worstHf.toFixed(2)}x in ${worstSource}).`
          : `Lowest health factor ${worstHf.toFixed(2)}x in ${worstSource} — recommend topping up collateral.`,
        meta: { worstHealthFactor: worstHf, worstSource },
      },
    };
  },
};

// ---------- Idle capital ----------

/** @type {Rule} */
const idleCapitalRule = {
  id: 'idle-capital',
  title: 'Idle capital',
  description:
    'Bitcoin and stablecoins sitting in the wallet earning 0% are a missed ' +
    'opportunity, but not a hazard — capped at -10 to reflect that.',
  maxAbsDelta: 10,
  apply(snap) {
    const total = Number(snap.totalUsd);
    if (total === 0) return ruleZero(this, 'Empty wallet.');
    let positions = 0;
    for (const p of snap.positions) positions += Number(p.principal.usdValue);
    const idleShare = Math.max(0, (total - positions) / total);
    let delta = 0;
    if (idleShare > 0.8) delta = -10;
    else if (idleShare > 0.5) delta = -5;
    else if (idleShare > 0.3) delta = -2;
    return {
      ruleId: this.id,
      title: this.title,
      delta,
      maxAbsDelta: this.maxAbsDelta,
      evidence: {
        message: delta === 0
          ? `${pct(idleShare)} idle — within reasonable working balance.`
          : `${pct(idleShare)} of holdings sitting idle.`,
        meta: { idleShare },
      },
    };
  },
};

// ---------- Asset diversity (positive points) ----------

/** @type {Rule} */
const assetDiversityRule = {
  id: 'asset-diversity',
  title: 'Asset diversity',
  description:
    'Awards up to +5 for holding meaningful balances of multiple distinct ' +
    'asset types (BTC, STX, stablecoin). Reduces single-asset blow-up risk.',
  maxAbsDelta: 5,
  apply(snap) {
    const meaningful = snap.balances.filter((b) => Number(b.usdValue) >= 50);
    const symbols = new Set(meaningful.map((b) => b.symbol.toUpperCase()));
    let delta = 0;
    const hasBtc = symbols.has('SBTC') || symbols.has('BTC');
    const hasStx = symbols.has('STX') || symbols.has('STSTX');
    const hasStable = ['USDH', 'USDC', 'USDCX', 'USDA', 'USDT'].some((s) => symbols.has(s));
    const types = [hasBtc, hasStx, hasStable].filter(Boolean).length;
    if (types >= 3) delta = +5;
    else if (types === 2) delta = +2;
    return {
      ruleId: this.id,
      title: this.title,
      delta,
      maxAbsDelta: this.maxAbsDelta,
      evidence: {
        message: `Holds ${types} of 3 asset types (BTC / STX / stablecoin).`,
        meta: { hasBtc, hasStx, hasStable },
      },
    };
  },
};

// ---------- Protocol risk weighting ----------

/** @type {Rule} */
const protocolRiskRule = {
  id: 'protocol-risk',
  title: 'Smart-contract risk exposure',
  description:
    'Penalises capital deployed in protocols flagged high-risk (very new, ' +
    'unaudited, or carrying unique custody assumptions).',
  maxAbsDelta: 15,
  apply(snap) {
    let highRiskUsd = 0;
    let total = 0;
    for (const p of snap.positions) {
      const v = Number(p.principal.usdValue);
      total += v;
      // The risk classification is carried on each adapter's meta and copied
      // onto positions by the portfolio enricher. If you don't have it yet,
      // this rule is a no-op (returns 0) — safe default.
      // @ts-ignore — extension field set by enricher
      const sc = p._risk?.smartContract;
      if (sc === 'high') highRiskUsd += v;
    }
    if (total === 0) return ruleZero(this, 'No positions to evaluate.');
    const share = highRiskUsd / total;
    let delta = 0;
    if (share > 0.5) delta = -15;
    else if (share > 0.25) delta = -8;
    else if (share > 0.1) delta = -3;
    return {
      ruleId: this.id,
      title: this.title,
      delta,
      maxAbsDelta: this.maxAbsDelta,
      evidence: {
        message: delta === 0
          ? `Low exposure to high-risk protocols (${pct(share)}).`
          : `${pct(share)} of position value sits in protocols flagged high-risk.`,
        meta: { highRiskShare: share },
      },
    };
  },
};

/** @type {Rule[]} */
export const RULES = [
  concentrationRule,
  liquidationBufferRule,
  idleCapitalRule,
  assetDiversityRule,
  protocolRiskRule,
];

// ---------- helpers ----------

/**
 * @param {Rule} rule
 * @param {string} message
 * @returns {RuleResult}
 */
function ruleZero(rule, message) {
  return {
    ruleId: rule.id,
    title: rule.title,
    delta: 0,
    maxAbsDelta: rule.maxAbsDelta,
    evidence: { message },
  };
}

/** @param {number} v */
function pct(v) {
  return `${(v * 100).toFixed(0)}%`;
}

export { BASE_SCORE };
