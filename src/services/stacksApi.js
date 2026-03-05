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

        // ✅ Format transactions correctly for Stacks testnet
        return data.results.map(tx => ({
            txId: tx.tx_id,
            // ✅ Correct Stacks testnet explorer URL
            explorerUrl: address.startsWith('ST')
                ? `https://explorer.hiro.so/txid/${tx.tx_id}?chain=testnet`
                : `https://explorer.hiro.so/txid/${tx.tx_id}`,
            type: tx.tx_type,
            status: tx.tx_status,
            amount: tx.token_transfer?.amount
                ? (parseInt(tx.token_transfer.amount) / 1_000_000).toFixed(4) + ' STX'
                : '--',
            date: new Date(tx.burn_block_time_iso).toLocaleDateString(),
            // ✅ Short format: first 6...last 4 chars
            shortTxId: `${tx.tx_id.slice(0, 8)}...${tx.tx_id.slice(-6)}`,
        }));
    } catch (err) {
        console.error('Transaction history error:', err);
        return [];
    }
}

export async function getSTXPrice() {
    try {
        const res = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd'
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data?.blockstack?.usd || 0;
    } catch (err) {
        console.error('STX price error:', err);
        return 0;
    }
}

export async function getFullPortfolio(address) {
    const [stxBalance, sbtcBalance, txHistory, stxPrice] = await Promise.all([
        getSTXBalance(address),
        getSBTCBalance(address),
        getTransactionHistory(address),
        getSTXPrice(),
    ]);

    const totalUSD = (parseFloat(stxBalance) * stxPrice).toFixed(2);

    return { stxBalance, sbtcBalance, txHistory, stxPrice, totalUSD };
}
