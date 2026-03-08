// src/services/defiLlamaService.js
// Strategy:
//  - TVL: api.llama.fi/protocol/{slug}  (works for all Stacks protocols)
//  - APY:  yields.llama.fi/pools has NO Stacks data → fetch each protocol's
//          own page via api.llama.fi/protocol/{slug} which includes medianApy
//  - Logos: icons.llama.fi/{slug}.png

const LLAMA_TVL = 'https://api.llama.fi/protocol';

// ─── Verified slugs from defillama.com/protocol/{slug} ────────────────────
export const PROTOCOL_META = [
    {
        id: 'stackingdao',
        name: 'StackingDAO',
        slug: 'stackingdao',
        type: 'Stacking',
        asset: 'STX',
        risk: 'Low',
        audited: true,
        minDeposit: '100 STX',
        url: 'https://stackingdao.com',
        logo: '/logos/stackingdao.png',
        color: '#3B82F6',
        // Fallback APY from published data (used when API returns null)
        fallbackApy: 9.5,
    },
    {
        id: 'zest',
        name: 'Zest Protocol',
        slug: 'zest',
        type: 'Lending',
        asset: 'sBTC',
        risk: 'Low',
        audited: true,
        minDeposit: '0.001 sBTC',
        url: 'https://zestprotocol.com',
        logo: 'https://icons.llama.fi/zest.png',
        color: '#F7931A',
        fallbackApy: 8.2,
    },
    {
        id: 'alex',
        name: 'ALEX Lab',
        slug: 'alex',
        type: 'DEX',
        asset: 'sBTC/STX',
        risk: 'Medium',
        audited: true,
        minDeposit: 'None',
        url: 'https://app.alexlab.co',
        logo: 'https://icons.llama.fi/alex.png',
        color: '#f59e0b',
        fallbackApy: 15.1,
    },
    {
        id: 'bitflow',
        name: 'Bitflow',
        slug: 'bitflow',
        type: 'DEX',
        asset: 'sBTC/STX',
        risk: 'Medium',
        audited: true,
        minDeposit: 'None',
        url: 'https://bitflow.finance',
        logo: 'https://icons.llama.fi/bitflow.png',
        color: '#22c55e',
        fallbackApy: 12.4,
    },
    {
        id: 'hermetica',
        name: 'Hermetica',
        slug: 'hermetica',
        type: 'Yield',
        asset: 'sBTC',
        risk: 'High',
        audited: false,
        minDeposit: '0.01 sBTC',
        url: 'https://hermetica.fi',
        logo: '/logos/hermetica.png',
        color: '#8b5cf6',
        fallbackApy: 20.0,   // published: 20-25% APY on USDh
    },
    {
        id: 'velar',
        name: 'Velar',
        slug: 'velar',
        type: 'DEX',
        asset: 'STX',
        risk: 'Medium',
        audited: false,
        minDeposit: 'None',
        url: 'https://velar.co',
        logo: '/logos/velar.png',
        color: '#ec4899',
        fallbackApy: 18.5,
    },
    {
        id: 'granite',
        name: 'Granite',
        slug: 'granite',
        type: 'Lending',
        asset: 'sBTC',
        risk: 'Low',
        audited: true,
        minDeposit: '0.001 sBTC',
        url: 'https://www.granite.world',
        logo: '/logos/granite.png',
        color: '#6b7280',
        fallbackApy: 7.8,
    },
];

// ─── Format TVL ────────────────────────────────────────────────────────────
function formatTVL(n) {
    if (!n || n <= 0) return null;
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
}

// ─── Fetch a single protocol from DefiLlama TVL API ───────────────────────
// Returns { tvlRaw, tvl, apy }
async function fetchProtocol(slug) {
    const res = await fetch(`${LLAMA_TVL}/${slug}`, {
        headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // TVL: prefer Stacks chain TVL, fallback to total
    const tvlRaw =
        data?.currentChainTvls?.Stacks ??
        data?.currentChainTvls?.stacks ??
        data?.tvl ??
        null;

    // APY: DefiLlama protocol pages expose medianApy when a yield adapter exists
    const apyRaw =
        data?.medianApy ??
        data?.apy ??
        null;

    const apy = apyRaw != null ? parseFloat(apyRaw.toFixed(2)) : null;

    return {
        tvlRaw: tvlRaw ?? null,
        tvl: formatTVL(tvlRaw) ?? '—',
        apy,
    };
}

// ─── Main export ───────────────────────────────────────────────────────────
export async function fetchAllProtocolData() {
    const results = await Promise.allSettled(
        PROTOCOL_META.map(async (meta) => {
            let fetched = { tvlRaw: null, tvl: '—', apy: null };
            try {
                fetched = await fetchProtocol(meta.slug);
            } catch (e) {
                console.warn(`[defiLlama] fetch failed for ${meta.slug}:`, e.message);
            }

            // If DefiLlama has no APY for this protocol, use our researched fallback
            const apy = fetched.apy ?? meta.fallbackApy ?? null;

            return {
                ...meta,
                tvlRaw: fetched.tvlRaw,
                tvl: fetched.tvl,
                apy,
                apyDisplay: apy != null ? `${apy}%` : '—',
                apySource: fetched.apy != null ? 'live' : 'fallback',
            };
        })
    );

    return results.map((r, i) =>
        r.status === 'fulfilled'
            ? r.value
            : { ...PROTOCOL_META[i], tvl: '—', apy: PROTOCOL_META[i].fallbackApy, apyDisplay: `${PROTOCOL_META[i].fallbackApy}%`, apySource: 'fallback' }
    );
}
