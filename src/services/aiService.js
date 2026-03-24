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
    const isDev = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    // Claude API via Anthropic Messages API
    // Note: Calling Anthropic directly from the frontend requires 'anthropic-dangerous-direct-browser-access': 'true'
    const apiUrl = 'https://api.anthropic.com/v1/messages';

    const isNewUser = strategyCount === 0 && txCount < 3;
    const isExperienced = strategyCount > 5 || txCount > 20;

    const userContext = isNewUser
        ? `IMPORTANT: This is a BRAND NEW user to Stacks DeFi. 
       They may not understand DeFi concepts yet. 
       Be extra welcoming, explain terms simply, 
       and recommend the safest starting point.`
        : isExperienced
            ? `IMPORTANT: This is an EXPERIENCED DeFi user with ${strategyCount} 
       strategies anchored and ${txCount} transactions. 
       Skip basics, give advanced multi-protocol strategies, 
       mention yield optimization and compounding tactics.`
            : `This user has some DeFi experience. 
       Balance explanation with actionable advice.`;

    const protocolSummary = protocols
        .map(p => `- ${p.name}: ${p.type}, ${p.apy}% APY, ${p.risk} risk, accepts ${p.asset}, TVL ${p.tvl}`)
        .join('\n');

    const prompt = `You are Staxiq, the smartest Bitcoin DeFi copilot on the Stacks L2 ecosystem.
You have deep knowledge of every Stacks DeFi protocol and give personalized, 
data-driven strategies that actually help users grow their Bitcoin.

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

    console.log('API Key present:', !!import.meta.env.VITE_CLAUDE_API_KEY);
    console.log('Risk profile:', riskProfile);
    console.log('Address:', address);

    const response = await fetch(
        apiUrl,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1500,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }]
            }),
        }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || 'AI request failed');
    }

    const data = await response.json();
    const result = data.content?.[0]?.text;

    if (!result) {
        console.error('Claude API returned no content:', data);
        throw new Error('AI returned an empty response. Please try a different risk profile.');
    }

    console.log('AI Strategy Generated successfully');
    return result;
}
