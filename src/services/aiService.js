const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002';

/**
 * Request an AI strategy via the backend proxy.
 *
 * The backend owns the Anthropic API key; the frontend sends portfolio params
 * and receives the generated strategy text. Falls back to a direct browser
 * call only when VITE_CLAUDE_API_KEY is set (local dev without a running
 * backend server).
 */
export async function getAIStrategy({
    address,
    stxBalance,
    sbtcBalance,
    totalUSD,
    riskProfile,
    protocols,
    strategyCount = 0,
    txCount = 0,
}) {
    // Prefer backend proxy (API key stays server-side)
    try {
        const res = await fetch(`${API_BASE}/api/copilot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address,
                stxBalance,
                sbtcBalance,
                totalUSD,
                riskProfile,
                protocols,
                strategyCount,
                txCount,
            }),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.text) return data.text;
        }

        // Surface the backend's error message if available
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Backend returned ${res.status}`);
    } catch (backendErr) {
        // If a direct key is configured fall back to browser call (dev only)
        const directKey = import.meta.env.VITE_CLAUDE_API_KEY;
        if (!directKey) throw backendErr;

        return callAnthropicDirect({
            address, stxBalance, sbtcBalance, totalUSD,
            riskProfile, protocols, strategyCount, txCount,
            apiKey: directKey,
        });
    }
}

/** Direct browser call — only used in dev when VITE_CLAUDE_API_KEY is set. */
async function callAnthropicDirect({
    address, stxBalance, sbtcBalance, totalUSD,
    riskProfile, protocols, strategyCount, txCount, apiKey,
}) {
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

${isNewUser ? `Format your response EXACTLY like this:
👋 WELCOME TO BITCOIN DEFI
[One warm sentence]

🎯 YOUR FIRST STRATEGY: [Simple one-line recommendation]

📖 WHAT THIS MEANS: [2 sentences]

💰 WHAT YOU COULD EARN: [Specific number]

🛡️ IS IT SAFE?: [One sentence]

🚀 HOW TO START: [Step 1, 2, 3]` : `Format your response EXACTLY like this:
🎯 STRATEGY: [Bold one-line recommendation]

📊 ALLOCATION: [Specific % breakdown]

💰 PROJECTED RETURN: [Specific APY and USD return]

⚡ OPTIMIZATION: [One advanced tactic]

⚠️ KEY RISK: [Most important risk]

🚀 EXECUTE NOW: [Specific next action]`}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || 'AI request failed');
    }

    const data = await response.json();
    const result = data.content?.[0]?.text?.replace(/\*/g, '');
    if (!result) throw new Error('AI returned an empty response. Please try a different risk profile.');
    return result;
}
