// src/services/portfolioProtocols.js
// Detects which Stacks DeFi protocols a connected wallet has positions in
// Uses Hiro API to check token balances and transaction history

const HIRO_API = 'https://api.hiro.so';

// Known Stacks protocol contract addresses and their LP/receipt tokens
const PROTOCOL_CONTRACTS = [
    {
        id: 'stackingdao',
        name: 'StackingDAO',
        color: '#3B82F6',
        asset: 'stSTX',
        type: 'Stacking',
        // stSTX receipt token contract
        tokenContract: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token',
        description: 'Liquid stacking position',
    },
    {
        id: 'zest',
        name: 'Zest Protocol',
        color: '#F7931A',
        asset: 'zsBTC',
        type: 'Lending',
        tokenContract: 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.zest-reward-dist',
        description: 'sBTC lending position',
    },
    {
        id: 'alex',
        name: 'ALEX Lab',
        color: '#f59e0b',
        asset: 'atALEX',
        type: 'DEX / Yield',
        tokenContract: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.auto-alex-v3',
        description: 'Auto-compounding ALEX position',
    },
    {
        id: 'bitflow',
        name: 'Bitflow',
        color: '#22c55e',
        asset: 'stxSTX-LP',
        type: 'DEX LP',
        tokenContract: 'STTWD9SPRQVD3P733V89SV0P8EP8QSB5B00ZBZQ.stxstx-lp-token-v-1-2',
        description: 'Liquidity pool position',
    },
    {
        id: 'hermetica',
        name: 'Hermetica',
        color: '#8b5cf6',
        asset: 'USDh',
        type: 'Yield',
        tokenContract: 'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1N.token-usdh',
        description: 'USDh yield position',
    },
    {
        id: 'velar',
        name: 'Velar',
        color: '#ec4899',
        asset: 'WELSH-LP',
        type: 'DEX LP',
        tokenContract: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx-welsh-lp-token',
        description: 'Liquidity pool position',
    },
    {
        id: 'granite',
        name: 'Granite',
        color: '#6b7280',
        asset: 'sBTC Collateral',
        type: 'Borrowing',
        tokenContract: 'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1N.granite-vault',
        description: 'Bitcoin-backed loan position',
    },
];

// Fetch all fungible token balances for a wallet
async function fetchTokenBalances(address) {
    const res = await fetch(
        `${HIRO_API}/extended/v1/address/${address}/balances`,
        { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`Hiro API error: ${res.status}`);
    const data = await res.json();
    return data.fungible_tokens ?? {};
}

// Fetch recent transactions to cross-check protocol interaction
async function fetchRecentTxs(address) {
    const res = await fetch(
        `${HIRO_API}/extended/v1/address/${address}/transactions?limit=50`,
        { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
}

// Main: returns array of protocols the wallet has active positions in
export async function detectWalletProtocols(address) {
    if (!address) return [];

    let tokenBalances = {};
    let recentTxs = [];

    try {
        [tokenBalances, recentTxs] = await Promise.all([
            fetchTokenBalances(address),
            fetchRecentTxs(address),
        ]);
    } catch (e) {
        console.warn('[portfolioProtocols] fetch error:', e.message);
        return [];
    }

    // Extract contract IDs from recent transactions
    const interactedContracts = new Set(
        recentTxs
            .map(tx =>
                tx?.contract_call?.contract_id ??
                tx?.smart_contract?.contract_id ??
                null
            )
            .filter(Boolean)
    );

    const detected = [];

    for (const protocol of PROTOCOL_CONTRACTS) {
        const [contractAddr] = protocol.tokenContract.split('.');
        const tokenKey = protocol.tokenContract;

        // Check 1: wallet holds the protocol's receipt/LP token
        const tokenBalance = tokenBalances[tokenKey]?.balance ?? '0';
        const hasToken = BigInt(tokenBalance) > 0n;

        // Check 2: wallet has transacted with the protocol's contract
        const hasInteracted = [...interactedContracts].some(id =>
            id.startsWith(contractAddr)
        );

        if (hasToken || hasInteracted) {
            detected.push({
                ...protocol,
                balance: tokenBalance,
                balanceNum: Number(BigInt(tokenBalance)) / 1_000_000, // microunits → units
                hasToken,
                hasInteracted,
                // Confidence: holding token = confirmed, tx only = likely
                confidence: hasToken ? 'confirmed' : 'likely',
            });
        }
    }

    return detected;
}
