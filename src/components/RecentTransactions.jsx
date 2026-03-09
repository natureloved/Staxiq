// src/components/RecentTransactions.jsx
import { useTheme } from '../context/ThemeContext';
import { useDemo } from '../context/DemoContext';
import { DEMO_TRANSACTIONS } from '../data/demoData';
import { useState, useEffect } from 'react';

const HIRO_API = 'https://api.hiro.so';

// Use testnet API for ST... addresses (same as stacksApi.js)
function getApiBase(address) {
    return address?.startsWith('ST')
        ? 'https://api.testnet.hiro.so'
        : 'https://api.hiro.so';
}

async function fetchTransactions(address) {
    const base = getApiBase(address);
    const res = await fetch(
        `${base}/extended/v1/address/${address}/transactions?limit=10`,
        { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.results ?? []).map(tx => {
        const isContractCall = tx.tx_type === 'contract_call';
        const contractId = tx.contract_call?.contract_id ?? '';
        const fnName = tx.contract_call?.function_name ?? '';

        let protocol = 'Stacks';
        let color = '#8899bb';
        if (contractId.includes('stackingdao')) { protocol = 'StackingDAO'; color = '#3B82F6'; }
        else if (contractId.includes('zest')) { protocol = 'Zest Protocol'; color = '#F7931A'; }
        else if (contractId.includes('alex')) { protocol = 'ALEX Lab'; color = '#f59e0b'; }
        else if (contractId.includes('bitflow')) { protocol = 'Bitflow'; color = '#22c55e'; }
        else if (contractId.includes('hermetica')) { protocol = 'Hermetica'; color = '#8b5cf6'; }
        else if (contractId.includes('velar')) { protocol = 'Velar'; color = '#ec4899'; }
        else if (contractId.includes('granite')) { protocol = 'Granite'; color = '#6b7280'; }

        const ts = new Date(tx.burn_block_time_iso ?? tx.receipt_time_iso);
        const diff = Math.floor((Date.now() - ts) / 1000);
        const timeAgo =
            diff < 3600 ? `${Math.floor(diff / 60)} min ago` :
                diff < 86400 ? `${Math.floor(diff / 3600)} hours ago` :
                    `${Math.floor(diff / 86400)} days ago`;

        // ✅ Extract Amount (STX)
        let amount = '—';
        if (tx.token_transfer) {
            amount = (parseInt(tx.token_transfer.amount) / 1_000_000).toFixed(2) + ' STX';
        } else if (tx.stx_transfers && tx.stx_transfers.length > 0) {
            const internalXfer = tx.stx_transfers.find(x =>
                x.sender === address || x.recipient === address
            );
            if (internalXfer) {
                amount = (parseInt(internalXfer.amount) / 1_000_000).toFixed(2) + ' STX';
            }
        }

        return {
            txId: tx.tx_id,
            type: isContractCall ? 'Contract Call' : 'Token Transfer',
            protocol,
            action: fnName
                ? fnName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                : tx.tx_type.replace(/_/g, ' '),
            amount,
            status: tx.tx_status === 'success' ? 'success' : 'pending',
            timestamp: timeAgo,
            color,
        };
    });
}

export default function RecentTransactions({ address }) {
    const { isDark } = useTheme();
    const { isDemoMode } = useDemo();

    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isDemoMode) {
            setTxs(DEMO_TRANSACTIONS);
            return;
        }
        if (!address) return;
        setLoading(true);
        fetchTransactions(address)
            .then(setTxs)
            .catch(e => console.warn('[RecentTransactions]', e.message))
            .finally(() => setLoading(false));
    }, [address, isDemoMode]);

    const s = {
        bg: isDark ? '#0d1117' : '#ffffff',
        card: isDark ? '#141c2e' : '#f8faff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#f0f4ff' : '#0a0e1a',
        muted: isDark ? '#8899bb' : '#64748b',
        dim: isDark ? '#4a5a7a' : '#94a3b8',
    };

    return (
        <div
            className="rounded-2xl p-6"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: '#3B82F611', border: '1px solid #3B82F633' }}
                    >
                        🕒
                    </div>
                    <div>
                        <p className="font-bold text-base" style={{ color: s.text }}>
                            Recent Transactions
                        </p>
                        <p className="text-xs" style={{ color: s.dim }}>
                            {isDemoMode ? 'Sample transaction history' : 'Your last 10 on-chain transactions'}
                        </p>
                    </div>
                </div>

                {!isDemoMode && address && (
                    <a
                        href={`https://explorer.hiro.so/address/${address}?chain=${address?.startsWith('ST') ? 'testnet' : 'mainnet'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                        style={{ color: '#3B82F6' }}
                    >
                        View all →
                    </a>
                )}
            </div>

            {/* Loading skeletons */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="h-14 rounded-xl animate-pulse"
                            style={{ background: s.card }}
                        />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && txs.length === 0 && (
                <div
                    className="rounded-xl p-4 text-center"
                    style={{ background: s.card, border: `1px solid ${s.border}` }}
                >
                    <p className="text-sm" style={{ color: s.muted }}>
                        No transactions found for this wallet.
                    </p>
                </div>
            )}

            {/* Transaction list */}
            {!loading && txs.length > 0 && (
                <div className="space-y-2">
                    {txs.map((tx, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between rounded-xl px-4 py-3"
                            style={{
                                background: s.card,
                                border: `1px solid ${tx.color}22`,
                                borderLeft: `3px solid ${tx.color}`,
                            }}
                        >
                            {/* Left — protocol + action */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate" style={{ color: s.text }}>
                                        {tx.action}
                                    </p>
                                    <p className="text-xs" style={{ color: s.dim }}>
                                        {tx.protocol} · {tx.type}
                                    </p>
                                </div>
                            </div>

                            {/* Right — amount + time + status */}
                            <div className="text-right flex-shrink-0 ml-3">
                                <p className="font-mono font-black text-sm" style={{ color: tx.color }}>
                                    {tx.amount}
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-0.5">
                                    <span style={{ fontSize: 9, color: s.dim }}>{tx.timestamp}</span>
                                    <span
                                        className="px-1.5 py-0.5 rounded-full font-bold"
                                        style={{
                                            fontSize: 9,
                                            background: tx.status === 'success' ? '#22c55e18' : '#f59e0b18',
                                            color: tx.status === 'success' ? '#22c55e' : '#f59e0b',
                                            border: `1px solid ${tx.status === 'success' ? '#22c55e33' : '#f59e0b33'}`,
                                        }}
                                    >
                                        {tx.status === 'success' ? '✓' : '…'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <p className="text-xs text-center mt-4" style={{ color: s.dim }}>
                Powered by Hiro Stacks API · Read-only
            </p>
        </div>
    );
}
