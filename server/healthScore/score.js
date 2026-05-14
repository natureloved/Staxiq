/**
 * @fileoverview Health score computation.
 *
 * Pure function over a portfolio snapshot. The output is verbose by design —
 * the UI uses every field. Never reduce to a single number; the breakdown
 * IS the product.
 */

import { BASE_SCORE, RULES, RUBRIC_VERSION } from './rubric.js';

/**
 * @typedef {Object} HealthScoreResult
 * @property {number} score              Final 0–100 score, clamped
 * @property {number} baseScore          Starting score before adjustments
 * @property {string} rubricVersion
 * @property {string} asOf
 * @property {import('./rubric.js').RuleResult[]} breakdown
 * @property {{ message: string, severity: 'info' | 'warn' | 'crit' }[]} highlights
 */

/**
 * @param {import('./rubric.js').PortfolioSnapshot} snap
 * @returns {HealthScoreResult}
 */
export function computeHealthScore(snap) {
  const breakdown = RULES.map((r) => r.apply(snap));

  let score = BASE_SCORE;
  for (const r of breakdown) score += r.delta;
  score = Math.max(0, Math.min(100, Math.round(score)));

  /** @type {HealthScoreResult['highlights']} */
  const highlights = [];
  for (const r of breakdown) {
    if (r.delta <= -15) highlights.push({ message: r.evidence.message, severity: 'crit' });
    else if (r.delta <= -5) highlights.push({ message: r.evidence.message, severity: 'warn' });
  }
  // Sort by severity: crit first, then warn.
  highlights.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  return {
    score,
    baseScore: BASE_SCORE,
    rubricVersion: RUBRIC_VERSION,
    asOf: new Date().toISOString(),
    breakdown,
    highlights,
  };
}

/**
 * @param {'info' | 'warn' | 'crit'} s
 */
function severityRank(s) {
  return s === 'crit' ? 2 : s === 'warn' ? 1 : 0;
}
