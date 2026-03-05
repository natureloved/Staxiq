export async function getAIStrategy({
    address,
    stxBalance,
    sbtcBalance,
    totalUSD,
    riskProfile,
    protocols,
}) {
    const isDev = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    // Gemini API works directly in production (Vercel)
    // Uses local proxy only in development
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

    const protocolSummary = protocols
        .map(p => `${p.name} (${p.type}, ${p.apy}% APY, ${p.risk} risk, ${p.asset})`)
        .join('\n');

    const prompt = `You are Staxiq, an expert AI DeFi copilot for the Stacks Bitcoin L2 ecosystem.
You give concise, actionable, plain-English DeFi strategy recommendations.
You always explain WHY you're recommending something.
You always mention one key risk the user should know about.
Keep responses under 150 words. Be direct, friendly and confident.

My wallet: ${address}
STX Balance: ${stxBalance} STX
sBTC Balance: ${sbtcBalance} sBTC
Total Portfolio Value: $${totalUSD} USD
Risk Profile: ${riskProfile}

Available Stacks DeFi protocols:
${protocolSummary}

Give me a personalized DeFi strategy recommendation based on my wallet and risk profile.
Format your response as:
🎯 RECOMMENDED STRATEGY: [one line summary]
📊 WHY: [2-3 sentences explaining the recommendation]
💰 EXPECTED RETURN: [estimated APY/return]
⚠️ KEY RISK: [one sentence on main risk to watch]
🚀 NEXT STEP: [one specific action to take right now]`;

    const response = await fetch(
        apiUrl,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                },
            }),
        }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || 'AI request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
