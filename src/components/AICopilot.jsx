import React, { useState, useEffect } from 'react';
import { useAIAdvisor } from '../hooks/useAIAdvisor';
import {
    saveRiskProfile,
    anchorStrategy,
    getStrategyCount
} from '../services/contractService';

const RISK_OPTIONS = ['Conservative', 'Balanced', 'Aggressive'];

const RISK_STYLES = {
    Conservative: 'bg-green-900/50 text-green-400 border-green-700',
    Balanced: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
    Aggressive: 'bg-red-900/50 text-red-400 border-red-700',
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

    // Load strategy count on mount
    useEffect(() => {
        if (address) {
            getStrategyCount(address).then(count => setStrategyCount(count));
        }
    }, [address]);

    async function handleGetStrategy() {
        setAnchored(false);
        setAnchorTxId(null);

        // Get AI strategy first
        const result = await fetchStrategy();

        // Then anchor to Bitcoin chain
        if (result) {
            try {
                setAnchoring(true);

                // Hash the strategy text
                const encoder = new TextEncoder();
                const data = encoder.encode(result);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')
                    .slice(0, 64);

                // Save risk profile + anchor strategy on-chain
                const [, anchorTx] = await Promise.all([
                    saveRiskProfile(riskProfile, address),
                    anchorStrategy(hashHex, 'StackingDAO'),
                ]);

                if (anchorTx) {
                    setAnchorTxId(anchorTx);
                    setAnchored(true);
                    // Refresh strategy count
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
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-gray-400 font-medium text-lg">Connect your wallet to unlock AI strategy advice</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <span className="text-xl">🤖</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg">AI DeFi Copilot</h2>
                        <p className="text-gray-400 text-sm">
                            Personalized Bitcoin DeFi strategy for your wallet
                        </p>
                    </div>
                </div>

            </div>

            {/* Risk Selector */}
            <div className="space-y-2">
                <p className="text-gray-400 text-sm font-medium">
                    Select your risk profile:
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {RISK_OPTIONS.map(risk => (
                        <button
                            key={risk}
                            onClick={() => setRiskProfile(risk)}
                            className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 flex-1 sm:flex-none ${riskProfile === risk
                                ? RISK_STYLES[risk]
                                : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
                                }`}
                        >
                            {risk}
                        </button>
                    ))}
                </div>
            </div>

            {/* Get Strategy Button */}
            <button
                onClick={handleGetStrategy}
                disabled={loading || anchoring}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/20"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Analyzing your portfolio...
                    </>
                ) : anchoring ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Anchoring to Bitcoin...
                    </>
                ) : strategy ? '🔄 Refresh Strategy' : '🎯 Get My Strategy'}
            </button>

            {/* Error Error */}
            {error && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
                    <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </p>
                </div>
            )}

            {/* AI Response Card */}
            {strategy && !loading ? (
                <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-inner">
                    {/* Strategy label */}
                    <div className="flex items-center gap-2 mb-2 pb-3 border-b border-gray-800/60">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                        <span className="text-green-400 text-xs font-bold uppercase tracking-wider">
                            Strategy generated for {riskProfile} profile
                        </span>
                    </div>

                    {/* Strategy text */}
                    <div className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-line font-medium prose prose-invert prose-p:my-2">
                        {strategy.split('\n').map((line, i) => {
                            // Bold the prefix labels (e.g. "🎯 RECOMMENDED STRATEGY:")
                            if (line.includes(': ')) {
                                const parts = line.split(': ');
                                return (
                                    <p key={i} className="my-2">
                                        <strong className="text-white font-bold">{parts[0]}:</strong> {parts.slice(1).join(': ')}
                                    </p>
                                );
                            }
                            return <p key={i} className="my-2">{line}</p>;
                        })}
                    </div>

                    {/* Bitcoin anchor badge */}
                    {anchored && anchorTxId && (
                        <div className="border-t border-gray-700/60 pt-4 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-orange-400 font-bold uppercase tracking-wider bg-orange-900/30 border border-orange-800/60 px-3 py-1 rounded-full">
                                    ⛓️ Anchored on Bitcoin via Stacks
                                </span>
                            </div>

                            <a
                                href={`https://explorer.hiro.so/txid/${anchorTxId}?chain=testnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs font-mono transition-colors block ml-3"
                            >
                                View on explorer: {anchorTxId.slice(0, 10)}...{anchorTxId.slice(-6)} ↗
                            </a>
                            {strategyCount > 0 && (
                                <div className="text-gray-400 text-xs font-medium mt-3 ml-3">
                                    {strategyCount} strategies anchored on Bitcoin
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : !loading && !error && (
                <div className="border border-dashed border-gray-800 rounded-xl bg-gray-950/30 flex items-center justify-center p-6 text-center min-h-[150px]">
                    <p className="text-gray-500 text-sm font-medium">Select a risk profile and click the button above to generate a personalized DeFi strategy.</p>
                </div>
            )}
        </div>
    );
}
