import React, { useState, useEffect } from 'react';
import { useAIAdvisor } from '../hooks/useAIAdvisor';
import {
    saveRiskProfile,
    anchorStrategy,
    getStrategyCount
} from '../services/contractService';

const RISK_OPTIONS = ['Conservative', 'Balanced', 'Aggressive'];

const RISK_STYLES = {
    Conservative: 'dark:bg-green-900/30 bg-green-100 dark:text-green-400 text-green-700 dark:border-green-700/50 border-green-300',
    Balanced: 'dark:bg-yellow-900/30 bg-yellow-100 dark:text-yellow-400 text-yellow-700 dark:border-yellow-700/50 border-yellow-300',
    Aggressive: 'dark:bg-red-900/30 bg-red-100 dark:text-red-400 text-red-700 dark:border-red-700/50 border-red-300',
};

// Typewriter Effect Component
const TypewriterText = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let i = 0;
        const speed = 15; // ms per char

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text]);

    return (
        <div className="dark:text-[#a8b8d8] text-gray-700 text-[15px] leading-relaxed whitespace-pre-line font-medium prose dark:prose-invert prose-p:my-2">
            {displayedText.split('\n').map((line, i) => {
                if (line.includes(': ')) {
                    const parts = line.split(': ');
                    return (
                        <p key={i} className="my-2">
                            <strong className="dark:text-white text-gray-900 font-bold">{parts[0]}:</strong> {parts.slice(1).join(': ')}
                        </p>
                    );
                }
                return <p key={i} className="my-2">{line}</p>;
            })}
        </div>
    );
};

export default function AICopilot({
    connected,
    address,
    stxBalance,
    sbtcBalance,
    totalUSD
}) {
    const {
        strategy,
        loading,
        error,
        riskProfile,
        setRiskProfile,
        fetchStrategy,
    } = useAIAdvisor({ address, stxBalance, sbtcBalance, totalUSD });

    const [anchored, setAnchored] = useState(false);
    const [anchorTxId, setAnchorTxId] = useState(null);
    const [strategyCount, setStrategyCount] = useState(0);
    const [anchoring, setAnchoring] = useState(false);

    const [typewriterComplete, setTypewriterComplete] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (address) {
            getStrategyCount(address).then(count => setStrategyCount(count));
        }
    }, [address]);

    // Save to history list
    useEffect(() => {
        if (strategy && typewriterComplete) {
            setHistory(prev => {
                const newEntry = { text: strategy, risk: riskProfile, date: new Date().toLocaleTimeString() };
                const exists = prev.some(h => h.text === strategy);
                if (exists) return prev;
                return [newEntry, ...prev].slice(0, 3);
            });
        }
    }, [strategy, typewriterComplete, riskProfile]);

    async function handleGetStrategy() {
        setAnchored(false);
        setAnchorTxId(null);
        setTypewriterComplete(false);

        const result = await fetchStrategy();

        if (result) {
            try {
                setAnchoring(true);
                const encoder = new TextEncoder();
                const data = encoder.encode(result);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64);

                const [, anchorTx] = await Promise.all([
                    saveRiskProfile(riskProfile, address),
                    anchorStrategy(hashHex, 'Staxiq'),
                ]);

                if (anchorTx) {
                    setAnchorTxId(anchorTx);
                    setAnchored(true);
                    const newCount = await getStrategyCount(address);
                    setStrategyCount(newCount);
                }
            } catch (anchorErr) {
                console.warn('Anchoring failed silently:', anchorErr);
            } finally {
                setAnchoring(false);
            }
        }
    }

    if (!connected) {
        return (
            <div className="dark:bg-[#0d1117]/60 bg-white border dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-8 text-center h-[500px] flex flex-col items-center justify-center shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b dark:from-orange-500/5 from-orange-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                <div className="w-20 h-20 dark:bg-[#0a0e1a] bg-gray-50 border dark:border-[#1e2d4a] border-gray-200 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    🤖
                </div>
                <h3 className="text-2xl font-black dark:text-white text-gray-900 font-display mb-2">Initialize Copilot</h3>
                <p className="dark:text-[#8899bb] text-[#4a5a7a] font-medium text-lg max-w-sm">Connect your wallet to unlock AI strategy advice and automated compounding.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Copilot Panel */}
            <div className="lg:col-span-2 dark:bg-[#0d1117]/60 bg-white border dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 xl:p-8 space-y-6 shadow-xl relative">

                {/* Header */}
                <div className="flex items-center justify-between border-b dark:border-[#1e2d4a]/60 border-gray-100 pb-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500 text-gray-950 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(247,147,26,0.3)]">
                            🤖
                        </div>
                        <div>
                            <h2 className="dark:text-white text-gray-900 font-black text-xl font-display tracking-tight">AI DeFi Copilot</h2>
                            <p className="dark:text-[#8899bb] text-[#4a5a7a] text-sm font-bold tracking-wide">
                                Personalized Bitcoin DeFi strategies
                            </p>
                        </div>
                    </div>
                </div>

                {/* Risk Selector */}
                <div className="space-y-3">
                    <p className="dark:text-[#8899bb] text-[#4a5a7a] text-xs font-bold uppercase tracking-widest">
                        Tolerance Profile:
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {RISK_OPTIONS.map(risk => (
                            <button
                                key={risk}
                                onClick={() => setRiskProfile(risk)}
                                className={`px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-300 flex-1 sm:flex-none ${riskProfile === risk
                                    ? RISK_STYLES[risk]
                                    : 'dark:bg-[#0a0e1a]/50 bg-gray-50 dark:text-[#8899bb] text-[#4a5a7a] dark:border-[#1e2d4a] border-gray-200 hover:border-gray-300 dark:hover:border-[#3a5080] dark:hover:text-[#d0d8f0] hover:text-gray-800'
                                    }`}
                            >
                                {risk}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGetStrategy}
                    disabled={loading || anchoring}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-[#1a2540] disabled:text-[#8899bb] text-white font-black py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(247,147,26,0.2)] hover:shadow-[0_10px_20px_rgba(247,147,26,0.4)] disabled:shadow-none hover:-translate-y-0.5 disabled:translate-y-0"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Deep Analyzing Portfolio...
                        </>
                    ) : anchoring ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-orange-200" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Writing to Bitcoin L2...
                        </>
                    ) : strategy ? '🔄 Recalculate Strategy' : '🎯 Generate My Strategy'}
                </button>

                {error && (
                    <div className="dark:bg-red-900/10 bg-red-50 border dark:border-red-900/30 border-red-200 rounded-xl p-4 flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="dark:text-red-400 text-red-600 text-sm font-bold">{error}</p>
                    </div>
                )}

                {/* AI Response Card */}
                {strategy && !loading ? (
                    <div className="dark:bg-[#0a0e1a]/80 bg-gray-50 border dark:border-[#1e2d4a] border-gray-200 rounded-xl p-6 space-y-5 shadow-inner relative overflow-hidden">

                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 to-orange-500"></div>

                        <div className="flex items-center gap-2 mb-2 pb-4 border-b dark:border-[#1e2d4a]/60 border-gray-200 ml-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                            <span className="text-green-600 dark:text-green-400 text-xs font-black uppercase tracking-widest font-mono">
                                Strategy Context: {riskProfile}
                            </span>
                        </div>

                        <div className="ml-2">
                            <TypewriterText text={strategy} onComplete={() => setTypewriterComplete(true)} />
                        </div>

                        {typewriterComplete && anchored && anchorTxId && (
                            <div className="border-t dark:border-[#1e2d4a]/60 border-gray-200 pt-5 mt-5 ml-2 space-y-3 animate-[fade-in_0.5s_ease-in-out]">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs dark:text-orange-400 text-orange-600 font-bold uppercase tracking-wider dark:bg-orange-900/20 bg-orange-100 border dark:border-orange-800/40 border-orange-200 px-3 py-1.5 rounded-md">
                                        ⛓️ Cryptographically Anchored
                                    </span>
                                </div>

                                <a
                                    href={`https://explorer.hiro.so/txid/${anchorTxId}?chain=testnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-400 text-xs font-mono font-bold transition-colors block"
                                >
                                    Verify Hash On-Chain: {anchorTxId.slice(0, 10)}...{anchorTxId.slice(-6)} ↗
                                </a>
                            </div>
                        )}
                    </div>
                ) : !loading && !error && (
                    <div className="border-2 border-dashed dark:border-[#1e2d4a] border-gray-200 rounded-xl dark:bg-[#0a0e1a]/30 bg-gray-50 flex items-center justify-center p-8 text-center min-h-[180px]">
                        <p className="dark:text-[#4a5a7a] text-[#8899bb] text-sm font-bold uppercase tracking-wide">Awaiting Profile Selection Context...</p>
                    </div>
                )}
            </div>

            {/* Sidebar History Panel */}
            <div className="dark:bg-[#0d1117]/60 bg-white border dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 shadow-xl flex flex-col">
                <div className="border-b dark:border-[#1e2d4a]/60 border-gray-100 pb-4 mb-4">
                    <h3 className="dark:text-white text-gray-900 font-black text-lg font-syne">Strategy Log</h3>
                    <p className="dark:text-[#4a5a7a] text-[#8899bb] text-xs font-bold mt-1 uppercase tracking-wider">Session Memory</p>
                </div>

                <div className="flex-grow space-y-4">
                    {history.length > 0 ? history.map((h, i) => (
                        <div key={i} className="dark:bg-[#0a0e1a]/50 bg-gray-50 border dark:border-[#1e2d4a] border-gray-200 rounded-lg p-4 hover:border-orange-500/50 transition-colors cursor-pointer relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-[#1a2540] group-hover:bg-orange-500 transition-colors"></div>
                            <div className="flex justify-between items-center mb-2 ml-2">
                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded shadow-sm ${RISK_STYLES[h.risk]}`}>
                                    {h.risk}
                                </span>
                                <span className="text-xs dark:text-[#4a5a7a] text-[#8899bb] font-mono font-bold">{h.date}</span>
                            </div>
                            <p className="text-xs dark:text-[#8899bb] text-gray-600 line-clamp-3 font-medium ml-2">{h.text.split('\n')[2] || "Aggregated Strategy..."}</p>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <span className="text-3xl mb-3 opacity-20">📜</span>
                            <p className="text-xs font-bold dark:text-gray-600 text-[#8899bb] uppercase tracking-widest leading-relaxed">No strategies generated in this session yet.</p>
                        </div>
                    )}
                </div>

                {strategyCount > 0 && (
                    <div className="mt-6 pt-4 border-t dark:border-[#1e2d4a]/60 border-gray-100">
                        <div className="w-full text-center p-3 rounded-lg dark:bg-[#0a0e1a] bg-gray-50 border dark:border-[#1e2d4a] border-gray-200">
                            <p className="text-xs dark:text-[#8899bb] text-[#4a5a7a] font-bold uppercase tracking-wider mb-1">Lifetime Anchored</p>
                            <p className="text-2xl font-black text-orange-500 font-mono">{strategyCount}</p>
                        </div>
                    </div>
                )}

                {history.length > 1 && (
                    <button className="w-full mt-4 border-2 dark:border-[#1e2d4a] border-gray-200 dark:text-[#a8b8d8] text-gray-700 hover:border-orange-500 hover:text-orange-500 dark:bg-[#0a0e1a] bg-white font-bold text-sm py-2.5 rounded-lg transition-all shadow-sm">
                        Compare Strategies
                    </button>
                )}
            </div>
        </div>
    );
}
