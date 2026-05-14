/**
 * @fileoverview Backend proxy for the AI Copilot.
 *
 * Keeping the Anthropic API call server-side means the key never reaches
 * the browser. The frontend sends the same parameters it always built locally;
 * this route rebuilds the prompt and calls Anthropic, then returns the text.
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const STACKS_ADDRESS_RE = /^S[PMNT][0-9A-HJKMNP-Z]{26,39}$/;

/**
 * @param {import('express').Express} app
 * @param {import('../integrations/types.js').AdapterContext} ctx
 */
export function mountCopilotRoutes(app, ctx) {
  app.post('/api/copilot', async (req, res) => {
    const {
      address,
      stxBalance,
      sbtcBalance,
      totalUSD,
      riskProfile,
      protocols = [],
      strategyCount = 0,
      txCount = 0,
    } = req.body || {};

    if (!address || !STACKS_ADDRESS_RE.test(address)) {
      return res.status(400).json({ error: 'invalid stacks address' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured on this server' });
    }

    const isNewUser = strategyCount === 0 && txCount < 3;
    const isExperienced = strategyCount > 5 || txCount > 20;

    const userContext = isNewUser
      ? `IMPORTANT: This is a BRAND NEW user to Stacks DeFi. Be extra welcoming, explain terms simply, and recommend the safest starting point.`
      : isExperienced
        ? `IMPORTANT: This is an EXPERIENCED DeFi user with ${strategyCount} strategies anchored and ${txCount} transactions. Skip basics, give advanced multi-protocol strategies.`
        : `This user has some DeFi experience. Balance explanation with actionable advice.`;

    const protocolSummary = protocols
      .map((p) => `- ${p.name}: ${p.type}, ${p.apy}% APY, ${p.risk} risk, accepts ${p.asset}, TVL ${p.tvl}`)
      .join('\n');

    const prompt = `You are Staxiq, the smartest Bitcoin DeFi copilot on the Stacks L2 ecosystem.
You have deep knowledge of every Stacks DeFi protocol and give personalized, data-driven strategies.

${userContext}

USER PORTFOLIO:
- Wallet: ${address}
- STX Balance: ${stxBalance} STX
- sBTC Balance: ${sbtcBalance} sBTC
- Total Value: $${totalUSD} USD
- Risk Profile: ${riskProfile}
- Strategies Generated: ${strategyCount}
- Transaction History: ${txCount} transactions

AVAILABLE PROTOCOLS ON STACKS:
${protocolSummary}

INSTRUCTIONS:
${isNewUser ? `
- Start with a warm welcome to Bitcoin DeFi
- Recommend ONE simple starting protocol
- Explain what they will actually DO with their funds
- Use simple analogies (e.g. "think of this like a savings account")
- Mention they can always start small
` : `
- Give a multi-protocol strategy
- Include specific allocation percentages
- Mention compounding or optimization tactics
- Reference their existing position size
- Give a bold, confident recommendation
`}

Format your response EXACTLY like this:
${isNewUser ? `
👋 WELCOME TO BITCOIN DEFI
[One warm sentence acknowledging this is their first time]

🎯 YOUR FIRST STRATEGY: [Simple one-line recommendation]

📖 WHAT THIS MEANS: [2 sentences explaining in plain English]

💰 WHAT YOU COULD EARN: [Specific number based on their balance]

🛡️ IS IT SAFE?: [One sentence on risk, reassuring but honest]

🚀 HOW TO START: [Literally step 1, 2, 3 — very specific]
` : `
🎯 STRATEGY: [Bold one-line recommendation]

📊 ALLOCATION: [Specific % breakdown across protocols]

💰 PROJECTED RETURN: [Specific APY and estimated USD return based on their balance]

⚡ OPTIMIZATION: [One advanced tactic to maximize yield]

⚠️ KEY RISK: [Most important risk to monitor]

🚀 EXECUTE NOW: [Specific next action with protocol name]
`}`;

    try {
      const upstream = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!upstream.ok) {
        const err = await upstream.json().catch(() => ({}));
        ctx.log('copilot: upstream error', { status: upstream.status, err });
        return res.status(502).json({ error: 'AI service temporarily unavailable' });
      }

      const data = await upstream.json();
      const text = data.content?.[0]?.text?.replace(/\*/g, '');

      if (!text) {
        ctx.log('copilot: empty response', { data });
        return res.status(502).json({ error: 'AI returned an empty response' });
      }

      res.json({ text });
    } catch (e) {
      ctx.log('copilot: fetch error', { err: String(e) });
      res.status(503).json({ error: 'AI service unavailable' });
    }
  });
}
