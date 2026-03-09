import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useProtocolData } from '../hooks/useProtocolData';
import { getAIStrategy } from '../services/aiService';
import {
    saveRiskProfile,
    anchorStrategy,
    getStrategyCount,
} from '../services/contractService';

const RISK_OPTIONS = ['HODLer', 'Builder', 'Degen'];

const RISK_CONFIG = {
    HODLer: { color: '#22c55e', bg: '#22c55e18', border: '#22c55e44', label: 'HODLer', desc: 'Preserve capital, focus on Stacking rewards.' },
    Builder: { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b44', label: 'Builder', desc: 'Moderate growth via sBTC and stable yields.' },
    Degen: { color: '#ef4444', bg: '#ef444418', border: '#ef444444', label: 'Degen', desc: 'High yield via perp DEXs and leverage.' },
};

function parseStrategy(text) {
    const sections = [];
    const lines = text.split('\n');
    let current = null;
    const SECTION_EMOJIS = ['👋', '🎯', '📖', '📊', '💰', '🛡️', '🚀', '⚡', '🔁', '⚠️', '💡', '✅'];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const startsSection = SECTION_EMOJIS.some(e => trimmed.startsWith(e));
        if (startsSection) {
            if (current) sections.push(current);
            current = { heading: trimmed, body: [] };
        } else if (current) {
            current.body.push(trimmed);
        } else {
            sections.push({ heading: null, body: [trimmed] });
        }
    }
    if (current) sections.push(current);
    return sections;
}

function getSectionColor(heading, isDark) {
    if (!heading) return isDark ? '#8899bb' : '#334155';
    if (heading.startsWith('⚠️') || heading.startsWith('🛡️')) return '#f59e0b';
    if (heading.startsWith('🚀') || heading.startsWith('✅')) return '#22c55e';
    if (heading.startsWith('💰') || heading.startsWith('📊')) return '#F7931A';
    if (heading.startsWith('⚡') || heading.startsWith('🔁')) return '#3B82F6';
    return isDark ? '#f0f4ff' : '#0a0e1a';
}

function stripEmoji(str) {
    if (!str) return str;
    return str.replace(/^[\p{Emoji}\u{FE0F}\u{20E3}\s]+/u, '').trim();
}

function StrategySection({ heading, body, isDark, isLast, headingColor }) {
    return (
        <div className={`py-4 ${!isLast ? 'border-b' : ''}`} style={{ borderColor: isDark ? '#1e2d4a' : '#dde5f5' }}>
            {heading && (
                <p className="font-bold text-sm mb-3 uppercase tracking-wider" style={{ color: headingColor }}>
                    {stripEmoji(heading)}
                </p>
            )}
            <div className="space-y-2">
                {body.map((line, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: isDark ? '#c8d8f0' : '#4a5a7a' }}>
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
}

export default function AICopilotPage({ connected, address, stxBalance, sbtcBalance, totalUSD, txCount }) {
    const { isDark } = useTheme();
    const { protocols } = useProtocolData();

    const [riskProfile, setRiskProfile] = useState('Builder');
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState(null);
    const [sections, setSections] = useState([]);
    const [anchoring, setAnchoring] = useState(false);
    const [anchorTxId, setAnchorTxId] = useState(null);
    const [strategyCount, setStrategyCount] = useState(0);

    useEffect(() => {
        if (address) {
            getStrategyCount(address).then(c => setStrategyCount(Number(c) || 0));
        }
    }, [address]);

    const handleGenerate = async () => {
        setLoading(true);
        setStrategy(null);
        setSections([]);
        setAnchorTxId(null);

        try {
            const result = await getAIStrategy({
                address, stxBalance, sbtcBalance, totalUSD,
                riskProfile, protocols, strategyCount, txCount
            });
            setStrategy(result);
            setSections(parseStrategy(result));

            // Auto-anchor logic
            setAnchoring(true);
            const encoder = new TextEncoder();
            const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(result));
            const hashHex = Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('').slice(0, 64);

            const txId = await anchorStrategy(hashHex, protocols[0]?.name || 'Stacks');
            if (txId) {
                setAnchorTxId(txId);
                const newCount = await getStrategyCount(address);
                setStrategyCount(Number(newCount) || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setAnchoring(false);
        }
    };

    if (!connected) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                    <span className="text-4xl text-orange-500">🤖</span>
                </div>
                <h1 className="text-3xl font-black mb-4 dark:text-white text-gray-900">AI Intelligence Terminal</h1>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Connect your Stacks wallet to access custom-built Bitcoin DeFi strategies and anchor them immutably on-chain.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Sidebar - Config */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="dark:bg-[#0d1117] bg-white border dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <span className="text-xl">⚙️</span>
                            </div>
                            <h2 className="font-bold text-lg dark:text-white">Terminal Config</h2>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest dark:text-gray-500">Risk Profile</label>
                            <div className="grid grid-cols-1 gap-3">
                                {RISK_OPTIONS.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRiskProfile(r)}
                                        className="p-4 rounded-xl text-left transition-all border"
                                        style={{
                                            background: riskProfile === r ? RISK_CONFIG[r].bg : 'transparent',
                                            borderColor: riskProfile === r ? RISK_CONFIG[r].border : (isDark ? '#1e2d4a' : '#dde5f5'),
                                        }}
                                    >
                                        <p className="font-bold text-sm mb-1" style={{ color: riskProfile === r ? RISK_CONFIG[r].color : (isDark ? '#f0f4ff' : '#0a0e1a') }}>
                                            {r}
                                        </p>
                                        <p className="text-[10px] opacity-70 dark:text-gray-400 leading-tight">
                                            {RISK_CONFIG[r].desc}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading || anchoring}
                                className="w-full py-4 mt-6 bg-orange-500 hover:bg-orange-600 rounded-xl font-black text-white shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? 'Computing...' : 'Initialize Analysis'}
                            </button>
                        </div>
                    </div>

                    {/* Stats Box */}
                    <div className="dark:bg-[#141c2e] bg-gray-50 border dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Intelligence Metrics</p>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-400">Anchored Strategies</span>
                                <span className="text-xs font-mono font-bold dark:text-white text-gray-900">{strategyCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-400">Integrations</span>
                                <span className="text-xs font-mono font-bold dark:text-white text-gray-900">{protocols.length} Protocols</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Area - Terminal Output */}
                <div className="lg:col-span-8">
                    <div className="dark:bg-[#0d1117] bg-white border dark:border-[#1e2d4a] border-gray-200 rounded-2xl min-h-[600px] flex flex-col shadow-2xl overflow-hidden">
                        {/* Terminal Header */}
                        <div className="px-6 py-4 border-b dark:border-[#1e2d4a] border-gray-100 flex items-center justify-between bg-gray-50/50 dark:bg-transparent">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
                            </div>
                            <p className="text-[10px] font-mono font-bold dark:text-gray-500 uppercase tracking-widest">
                                staxiq_terminal_v1.0.4
                            </p>
                        </div>

                        {/* Output area */}
                        <div className="flex-1 p-8 overflow-y-auto font-sans">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                    <p className="font-mono text-sm text-gray-500 animate-pulse">Consulting Bitcoin DeFi Oracle...</p>
                                </div>
                            ) : sections.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="mb-8 p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-green-500 font-bold">●</span>
                                            <p className="text-xs font-bold text-green-500 uppercase">Analysis Complete · 100% Reliability</p>
                                        </div>
                                        {anchorTxId && (
                                            <a
                                                href={`https://explorer.hiro.so/txid/${anchorTxId}?chain=testnet`}
                                                target="_blank"
                                                className="text-[10px] font-mono text-blue-500 hover:underline"
                                            >
                                                Anchored TX: {anchorTxId.slice(0, 8)}...
                                            </a>
                                        )}
                                    </div>
                                    {sections.map((sec, i) => (
                                        <StrategySection
                                            key={i}
                                            heading={sec.heading}
                                            body={sec.body}
                                            isDark={isDark}
                                            isLast={i === sections.length - 1}
                                            headingColor={getSectionColor(sec.heading, isDark)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto opacity-50">
                                    <p className="text-4xl mb-6">🎯</p>
                                    <h3 className="font-bold text-lg dark:text-white mb-2">Ready for Intel?</h3>
                                    <p className="text-sm dark:text-gray-400">Click initialize to generate a complete on-chain strategy tailored to your wallet's risk profile.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
