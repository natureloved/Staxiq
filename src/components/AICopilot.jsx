// src/components/AICopilot.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getAIStrategy } from '../services/aiService';
import { useProtocolData } from '../hooks/useProtocolData';
import {
    saveRiskProfile,
    anchorStrategy,
    getStrategyCount,
} from '../services/contractService';

const RISK_OPTIONS = ['HODLer', 'Builder', 'Degen'];

const RISK_CONFIG = {
    HODLer: { color: '#22c55e', bg: '#22c55e18', border: '#22c55e44', label: 'HODLer' },
    Builder: { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b44', label: 'Builder' },
    Degen: { color: '#ef4444', bg: '#ef444418', border: '#ef444444', label: 'Degen' },
};

// Parses the structured AI output into labeled sections
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

// Color-codes section headings (isDark needed for the default fallback)
function getSectionColor(heading, isDark) {
    if (!heading) return isDark ? '#8899bb' : '#334155';
    if (heading.startsWith('⚠️') || heading.startsWith('🛡️')) return '#f59e0b';
    if (heading.startsWith('🚀') || heading.startsWith('✅')) return '#22c55e';
    if (heading.startsWith('💰') || heading.startsWith('📊')) return '#F7931A';
    if (heading.startsWith('⚡') || heading.startsWith('🔁')) return '#3B82F6';
    return isDark ? '#f0f4ff' : '#0a0e1a';
}

// Strip leading emoji from a heading string
function stripEmoji(str) {
    if (!str) return str;
    return str.replace(/^[\p{Emoji}\u{FE0F}\u{20E3}\s]+/u, '').trim();
}

// Renders one parsed section — no individual box, just spaced content
function StrategySection({ heading, body, isDark, isLast, headingColor }) {
    return (
        <div style={{ paddingBottom: isLast ? 0 : 16, marginBottom: isLast ? 0 : 16, borderBottom: isLast ? 'none' : `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}` }}>
            {heading && (
                <p
                    className="font-bold text-sm mb-2"
                    style={{ color: headingColor, letterSpacing: '0.01em' }}
                >
                    {stripEmoji(heading)}
                </p>
            )}
            <div className="space-y-1">
                {body.map((line, i) => {
                    const isStep = /^(Step\s*\d+:|^\d+\.|^•)/.test(line);
                    const isAlloc = line.includes('%') && line.includes(':');

                    return (
                        <p
                            key={i}
                            className="text-sm leading-relaxed"
                            style={{
                                color: isDark ? '#c8d8f0' : '#334155',
                                borderLeft: isStep ? `2px solid ${headingColor}44` : 'none',
                                paddingLeft: isStep ? '10px' : 0,
                                fontWeight: isAlloc ? 600 : 400,
                                fontFamily: isAlloc ? "'JetBrains Mono', monospace" : 'inherit',
                            }}
                        >
                            {line}
                        </p>
                    );
                })}
            </div>
        </div>
    );
}

// Typing animation for the heading
function TypingText({ text, speed = 30 }) {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
    }, [text]);
    return <span>{displayed}</span>;
}

export default function AICopilot({ connected, address, stxBalance, sbtcBalance, totalUSD, txCount, demoStrategy }) {
    const { isDark } = useTheme();
    const { protocols } = useProtocolData();

    const [riskProfile, setRiskProfile] = useState('Balanced');
    const [strategy, setStrategy] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [anchored, setAnchored] = useState(false);
    const [anchorTxId, setAnchorTxId] = useState(null);
    const [anchoring, setAnchoring] = useState(false);
    const [strategyCount, setStrategyCount] = useState(0);
    const [sections, setSections] = useState([]);

    const s = (key) => ({
        bg: isDark ? '#0d1117' : '#ffffff',
        card: isDark ? '#141c2e' : '#f8faff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#f0f4ff' : '#0a0e1a',
        muted: isDark ? '#8899bb' : '#334155',
        dim: isDark ? '#4a5a7a' : '#8899bb',
    })[key];

    useEffect(() => {
        if (address) {
            getStrategyCount(address).then(c => setStrategyCount(Number(c) || 0));
        }
    }, [address]);

    // Pre-load demo strategy immediately
    useEffect(() => {
        if (demoStrategy) {
            setStrategy(demoStrategy);
            setSections(parseStrategy(demoStrategy));
        }
    }, [demoStrategy]);

    async function handleGetStrategy() {
        if (demoStrategy) {
            // In demo mode just re-parse the demo strategy
            setSections(parseStrategy(demoStrategy));
            return;
        }
        setLoading(true);
        setError(null);
        setStrategy(null);
        setSections([]);
        setAnchored(false);
        setAnchorTxId(null);

        try {
            const result = await getAIStrategy({
                address,
                stxBalance,
                sbtcBalance,
                totalUSD,
                riskProfile,
                protocols,
                strategyCount,
                txCount: Number(txCount) || 0,
            });

            setStrategy(result);
            setSections(parseStrategy(result));

            // Anchor to Bitcoin
            try {
                setAnchoring(true);
                const encoder = new TextEncoder();
                const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(result));
                const hashHex = Array.from(new Uint8Array(hashBuffer))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('')
                    .slice(0, 64);

                const topProtocol = protocols.find(p => p.apy)?.name ?? 'StackingDAO';
                const [, txId] = await Promise.all([
                    saveRiskProfile(riskProfile, address),
                    anchorStrategy(hashHex, topProtocol),
                ]);

                if (txId) {
                    setAnchorTxId(txId);
                    setAnchored(true);
                    const newCount = await getStrategyCount(address);
                    setStrategyCount(Number(newCount) || 0);
                }
            } catch (anchorErr) {
                console.warn('Anchoring failed silently:', anchorErr);
            } finally {
                setAnchoring(false);
            }
        } catch (err) {
            setError('Failed to generate strategy. Check your API key or try again.');
        } finally {
            setLoading(false);
        }
    }

    // ── Not connected state ──────────────────────────────────────────────────
    if (!connected) {
        return (
            <div
                className="rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4"
                style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
            >
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ background: '#3B82F611', border: '1px solid #3B82F633' }}
                >
                    🤖
                </div>
                <div>
                    <p className="font-bold text-lg mb-1" style={{ color: s('text') }}>
                        AI DeFi Copilot
                    </p>
                    <p className="text-sm" style={{ color: s('muted') }}>
                        Connect your wallet to get a personalized Bitcoin DeFi strategy
                    </p>
                </div>
            </div>
        );
    }

    const riskCfg = RISK_CONFIG[riskProfile];

    // ── Main UI ──────────────────────────────────────────────────────────────
    return (
        <div
            className="rounded-2xl p-0.5"
            style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
        >
            {/* Header */}
            <div
                className="px-6 py-5 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${s('border')}` }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: '#3B82F611', border: '1px solid #3B82F633' }}
                    >
                        🤖
                    </div>
                    <div>
                        <p className="font-bold text-base" style={{ color: s('text') }}>
                            AI DeFi Copilot
                        </p>
                        <p className="text-xs" style={{ color: s('dim') }}>
                            Powered by Gemini · Anchored on Bitcoin
                        </p>
                    </div>
                </div>

                {/* Strategy count badge */}
                {strategyCount > 0 && (
                    <div
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                            background: '#F7931A11',
                            border: '1px solid #F7931A33',
                            color: '#F7931A',
                        }}
                    >
                        ⛓️ {strategyCount} anchored on Bitcoin
                    </div>
                )}
            </div>

            <div className="p-6 space-y-5">

                <div className="grid grid-cols-3 gap-2">
                    {RISK_OPTIONS.map(r => {
                        const cfg = RISK_CONFIG[r];
                        const active = riskProfile === r;
                        return (
                            <button
                                key={r}
                                onClick={() => setRiskProfile(r)}
                                className="py-1.5 px-2 rounded-lg text-xs font-bold transition-all duration-200"
                                style={{
                                    background: active ? cfg.bg : 'transparent',
                                    border: `1px solid ${active ? cfg.border : s('border')}`,
                                    color: active ? cfg.color : s('muted'),
                                }}
                            >
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Generate button */}
            <div className="flex justify-center">
                <button
                    onClick={handleGetStrategy}
                    disabled={loading || anchoring}
                    className={`${strategy && !loading && !anchoring ? 'px-8' : 'w-full'} py-2 rounded-xl font-bold text-white text-sm
                transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                flex items-center justify-center gap-2`}
                    style={{
                        background: loading || anchoring
                            ? '#374151'
                            : 'linear-gradient(135deg, #F7931A, #e8820a)',
                        boxShadow: loading || anchoring ? 'none' : '0 4px 16px #F7931A33',
                    }}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Analyzing your portfolio…
                        </>
                    ) : anchoring ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Anchoring to Bitcoin…
                        </>
                    ) : strategy ? (
                        'Regenerate Strategy'
                    ) : (
                        '🎯 Get My Personalized Strategy'
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{
                        background: '#ef444418',
                        border: '1px solid #ef444444',
                        color: '#ef4444',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Strategy output */}
            {strategy && !loading && sections.length > 0 && (
                <div className="mt-6 pb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-green-400"
                            style={{ animation: 'pulse 2s infinite' }}
                        />
                        <span className="text-xs font-semibold" style={{ color: isDark ? '#22c55e' : '#16a34a' }}>
                            <TypingText text={`Strategy generated · ${riskProfile} profile · ${new Date().toLocaleTimeString()}`} />
                        </span>
                    </div>

                    {/* All sections in one box */}
                    <div
                        className="rounded-xl p-4 mx-2"
                        style={{
                            background: isDark ? '#0d111766' : '#f8faff',
                            border: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                        }}
                    >
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

                    {/* Bitcoin anchor badge */}
                    {anchored && anchorTxId && (
                        <div
                            className="rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 mt-3 mx-2"
                            style={{
                                background: '#F7931A0a',
                                border: '1px solid #F7931A33',
                            }}
                        >
                            <span className="text-xs font-bold" style={{ color: '#F7931A' }}>
                                ⛓️ Strategy anchored on Bitcoin via Stacks
                            </span>
                            <a
                                href={`https://explorer.hiro.so/txid/${anchorTxId}?chain=testnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono transition-colors"
                                style={{ color: '#3B82F6' }}
                            >
                                {anchorTxId.slice(0, 10)}…{anchorTxId.slice(-6)} ↗
                            </a>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
