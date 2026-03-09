// src/services/stacksApi.js

function getApiBase(address) {
    return address?.startsWith('ST')
        ? 'https://api.testnet.hiro.so'
        : 'https://api.hiro.so';
}

export async function getSTXBalance(address) {
    try {
        const res = await fetch(
            `${getApiBase(address)}/v2/accounts/${address}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Hiro API balance is returned as a hex string in microstacks
        return (parseInt(data.balance, 16) / 1000000).toFixed(4);
    } catch (err) {
        console.error('STX balance error:', err);
        return '0.0000';
    }
}

export async function getTokenBalances(address) {
    try {
        const res = await fetch(
            `${getApiBase(address)}/extended/v1/address/${address}/balances`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.fungible_tokens || {};
    } catch (err) {
        console.error('Token balances error:', err);
        return {};
    }
}

export async function getSBTCBalance(address) {
    try {
        const tokens = await getTokenBalances(address);
        const sBTCContracts = [
            'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
            'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token',
        ];
        for (const contract of sBTCContracts) {
            if (tokens[contract]) {
                return (parseInt(tokens[contract].balance) / 100000000).toFixed(8);
            }
        }
        return '0.00000000';
    } catch (err) {
        console.error('sBTC balance error:', err);
        return '0.00000000';
    }
}

export async function getTransactionHistory(address) {
    try {
        const res = await fetch(
            `${getApiBase(address)}/extended/v1/address/${address}/transactions?limit=10`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        return data.results.map(tx => ({
            txId: tx.tx_id,
            explorerUrl: address.startsWith('ST')
                ? `https://explorer.hiro.so/txid/${tx.tx_id}?chain=testnet`
                : `https://explorer.hiro.so/txid/${tx.tx_id}`,
            type: tx.tx_type,
            status: tx.tx_status,
            amount: tx.token_transfer?.amount
                ? (parseInt(tx.token_transfer.amount) / 1_000_000).toFixed(4) + ' STX'
                : '--',
            date: new Date(tx.burn_block_time_iso).toLocaleDateString(),
            shortTxId: `${tx.tx_id.slice(0, 8)}...${tx.tx_id.slice(-6)}`,
        }));
    } catch (err) {
        console.error('Transaction history error:', err);
        return [];
    }
}

/**
 * Resilient STX Price Fetcher
 * Checks localStorage first (shared with PriceTicker), then falls back to APIs
 */
export async function getSTXPrice() {
    // 1. Check shared cache from PriceTicker first (fastest)
    try {
        const cached = localStorage.getItem('staxiq_prices');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 3600000) { // 1 hour valid
                const price = parseFloat(data.stx.usd.replace(/,/g, ''));
                if (!isNaN(price) && price > 0) return price;
            }
        }
    } catch (e) { }

    // 2. Try CryptoCompare (Better CORS usually)
    try {
        const res = await fetch('https://min-api.cryptocompare.com/data/price?fsym=STX&tsyms=USD');
        if (res.ok) {
            const data = await res.json();
            if (data.USD) return data.USD;
        }
    } catch (e) { }

    // 3. Final fallback to CoinGecko
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd');
        if (res.ok) {
            const data = await res.json();
            return data?.blockstack?.usd || 2.85; // Sensible hard default
        }
    } catch (err) { }

    return 2.85;
}

export async function getFullPortfolio(address) {
    // Parallelize everything, but handle transaction history separately if needed
    // to ensure totalUSD is calculated ASAP
    const [stxBalance, sbtcBalance, txHistory, stxPrice] = await Promise.all([
        getSTXBalance(address),
        getSBTCBalance(address),
        getTransactionHistory(address),
        getSTXPrice(),
    ]);

    const totalUSD = (parseFloat(stxBalance) * stxPrice).toFixed(2);

    return { stxBalance, sbtcBalance, txHistory, stxPrice, totalUSD };
}
