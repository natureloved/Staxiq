/**
 * @fileoverview Copilot orchestration.
 *
 * Pipeline:
 *   1. Detect insights from the portfolio snapshot (idle capital, liquidation
 *      risk, yield rotation opportunities). Each insight is a structured
 *      object with an id — these become the "facts" the model can ground in.
 *   2. Call the model with the strict prompt + portfolio + insights.
 *   3. Validate the JSON output against the contract.
 *   4. Drop any recommendation whose groundedIn ids don't appear in facts.
 *   5. Return to the UI.
 *
 * Step 4 is the real safety net: even if the model hallucinates, the output
 * filter keeps ungrounded recommendations from ever reaching users.
 */

import { detectIdleCapital } from './insights/idleCapital.js';
import { COPILOT_SYSTEM_PROMPT, buildCopilotUserMessage } from './prompt.js';

/**
 * @typedef {Object} CopilotResult
 * @property {string} summary
 * @property {object[]} recommendations
 * @property {object[]} refusals
 * @property {string[]} dataConfidence  Slugs whose data was degraded
 */

/**
 * @param {object} args
 * @param {string} args.userQuestion
 * @param {import('../healthScore/rubric.js').PortfolioSnapshot} args.snap
 * @param {import('../healthScore/score.js').HealthScoreResult} args.health
 * @param {(messages: object[]) => Promise<string>} args.callModel
 *   Inject a model client so this is testable without network.
 * @returns {Promise<CopilotResult>}
 */
export async function runCopilot({ userQuestion, snap, health, callModel }) {
  // 1. Build facts from real on-chain state.
  const facts = [];
  for (const p of snap.positions) {
    facts.push({
      id: p.id,
      kind: 'position',
      summary: `${p.kind} of ${p.principal.amount} ${p.principal.symbol} (~$${p.principal.usdValue}) in ${p.protocolSlug}`,
      apyTotal: p.apyTotal,
      healthFactor: p.healthFactor ?? null,
    });
  }
  for (const r of health.breakdown) {
    if (r.delta !== 0) {
      facts.push({
        id: `rubric:${r.ruleId}`,
        kind: 'rubric-finding',
        summary: r.evidence.message,
        delta: r.delta,
      });
    }
  }

  // 2. Detect structured insights.
  const insights = [
    ...(await detectIdleCapital(snap)),
    // Add more insight detectors here as they're built:
    // ...(await detectLiquidationRisk(snap)),
    // ...(await detectYieldRotation(snap, yieldQuotes)),
  ];

  // Add insights as facts too — the model can ground in either.
  for (const ins of insights) {
    facts.push({ id: ins.id, kind: 'insight', summary: ins.summary, ...ins });
  }

  // 3. Call the model.
  const userMessage = buildCopilotUserMessage({
    userQuestion,
    portfolio: { totalUsd: snap.totalUsd, positionCount: snap.positions.length },
    facts,
    insights,
  });

  let raw;
  try {
    raw = await callModel([
      { role: 'system', content: COPILOT_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ]);
  } catch (e) {
    return {
      summary: 'Copilot is temporarily unavailable. Your portfolio data is live above.',
      recommendations: [],
      refusals: [],
      dataConfidence: [],
    };
  }

  // 4. Validate + filter.
  return validateAndFilter(raw, facts);
}

/**
 * Parse the model output, validate the shape, and drop any recommendation
 * whose groundedIn ids aren't in facts. Returns a safe-to-render object.
 *
 * @param {string} raw
 * @param {Array<{ id: string }>} facts
 * @returns {CopilotResult}
 */
export function validateAndFilter(raw, facts) {
  /** @type {any} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      summary: 'Copilot returned an invalid response. Try again or refine your question.',
      recommendations: [],
      refusals: [],
      dataConfidence: [],
    };
  }

  const factIds = new Set(facts.map((f) => f.id));
  const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

  const valid = [];
  for (const r of recs) {
    if (!r || typeof r !== 'object') continue;
    if (typeof r.title !== 'string' || typeof r.rationale !== 'string') continue;
    if (!Array.isArray(r.groundedIn) || r.groundedIn.length === 0) continue;
    const allGrounded = r.groundedIn.every((id) => factIds.has(id));
    if (!allGrounded) continue;
    if (!r.action || !r.risk) continue;
    valid.push(r);
  }

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 200) : '',
    recommendations: valid,
    refusals: Array.isArray(parsed.refusals) ? parsed.refusals : [],
    dataConfidence: [],
  };
}
