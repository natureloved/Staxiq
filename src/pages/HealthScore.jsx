import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { useDemo } from '../context/DemoContext';
import { DEMO_HEALTH } from '../data/demoData';

function calcHealthScore({ stxBalance, sbtcBalance, totalUSD, txCount }) {
    let score = 0;
    const issues = [];
    const wins = [];

    // 1. Has funds (20pts)
    if (totalUSD > 0) {
        score += 20;
        wins.push('Wallet has active funds');
    } else {
        issues.push({ text: 'No funds detected in wallet', impact: -20, fix: 'Add STX or sBTC to start earning' });
    }

    // 2. Has sBTC (25pts)
    if (parseFloat(sbtcBalance) > 0) {
        score += 25;
        wins.push('Holding sBTC — Bitcoin on Stacks');
    } else {
        issues.push({ text: 'No sBTC in wallet', impact: -15, fix: 'Bridge BTC to sBTC via Xverse for higher yields' });
    }

    // 3. Portfolio size (20pts)
    if (totalUSD >= 1000) { score += 20; wins.push('Strong portfolio size'); }
    else if (totalUSD >= 100) { score += 10; }
    else issues.push({ text: 'Small portfolio size', impact: -10, fix: 'Deposit more STX to access better yield tiers' });

    // 4. Transaction activity (15pts)
    if (txCount >= 10) { score += 15; wins.push('Active DeFi participant'); }
    else if (txCount >= 3) { score += 8; }
    else issues.push({ text: 'Low transaction activity', impact: -10, fix: 'Interact with at least one Stacks DeFi protocol' });

    // 5. Diversification bonus (20pts)
    const hasSTX = parseFloat(stxBalance) > 0;
    const hasBTC = parseFloat(sbtcBalance) > 0;
    if (hasSTX && hasBTC) {
        score += 20;
        wins.push('Diversified across STX and sBTC');
    } else {
        issues.push({ text: 'Single asset concentration', impact: -15, fix: 'Hold both STX and sBTC for better diversification' });
    }

    return { score: Math.min(100, score), issues, wins };
}

function ScoreRing({ score, isDark }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const filled = (score / 100) * circumference;
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#F7931A' : '#ef4444';
    const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
                <svg width="144" height="144" viewBox="0 0 144 144">
                    <circle
                        cx="72" cy="72" r={radius}
                        fill="none"
                        stroke={isDark ? '#141c2e' : '#f1f5ff'}
                        strokeWidth="12"
                    />
                    <circle
                        cx="72" cy="72" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="12"
                        strokeDasharray={`${filled} ${circumference}`}
                        strokeLinecap="round"
                        transform="rotate(-90 72 72)"
                        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${color}66)` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="font-mono font-black text-3xl"
                        style={{ color }}
                    >
                        {score}
                    </span>
                    <span
                        className="text-xs font-bold"
                        style={{ color }}
                    >
                        {label}
                    </span>
                </div>
            </div>
            <p
                className="text-sm font-semibold mt-2"
                style={{ color: isDark ? '#8899bb' : '#334155' }}
            >
                Bitcoin DeFi Health Score
            </p>
        </div>
    );
}

export default function HealthScore({ connected, address }) {
    const { isDark } = useTheme();
    const { isDemoMode } = useDemo();
    const showData = connected || isDemoMode;
    const livePortfolio = usePortfolio(isDemoMode ? null : address);
    const [animatedScore, setAnimatedScore] = useState(0);

    const { score, issues, wins } = isDemoMode
        ? DEMO_HEALTH
        : calcHealthScore({
            stxBalance: livePortfolio.stxBalance || '0',
            sbtcBalance: livePortfolio.sbtcBalance || '0',
            totalUSD: livePortfolio.totalUSD || 0,
            txCount: livePortfolio.txCount || 0,
        });

    useEffect(() => {
        if (!showData) return;
        const timer = setTimeout(() => {
            let current = 0;
            const interval = setInterval(() => {
                current += 2;
                setAnimatedScore(Math.min(current, score));
                if (current >= score) clearInterval(interval);
            }, 20);
            return () => clearInterval(interval);
        }, 300);
        return () => clearTimeout(timer);
    }, [showData, score]);

    const s = (val) => ({
        bg: isDark ? '#0d1117' : '#ffffff',
        card: isDark ? '#141c2e' : '#f8faff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#f0f4ff' : '#0a0e1a',
        muted: isDark ? '#8899bb' : '#334155',
        dim: isDark ? '#4a5a7a' : '#8899bb',
    })[val];

    if (!showData) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="font-display font-bold text-3xl mb-2"
                    style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}>
                    Wallet Health Score
                </h1>
                <div
                    className="rounded-2xl p-12 text-center mt-6"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <p className="text-4xl mb-4">🔗</p>
                    <p className="font-semibold mb-2" style={{ color: s('text') }}>
                        Connect your wallet to generate your Health Score
                    </p>
                    <p className="text-sm" style={{ color: s('dim') }}>
                        We analyze your portfolio diversification, activity, and yield optimization
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1
                    className="font-display font-bold text-3xl mb-1"
                    style={{ color: s('text') }}
                >
                    Wallet Health Score
                </h1>
                <p style={{ color: s('muted'), fontSize: 14 }}>
                    Your Bitcoin DeFi portfolio rating across diversification, risk and yield opportunity.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Score ring */}
                <div
                    className="rounded-2xl p-8 flex flex-col items-center justify-center"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <ScoreRing score={animatedScore} isDark={isDark} />

                    <div
                        className="mt-6 w-full rounded-xl p-3 text-center"
                        style={{
                            background: score >= 80
                                ? '#22c55e22'
                                : score >= 50 ? '#F7931A22' : '#ef444422',
                            border: `1px solid ${score >= 80
                                ? '#22c55e44'
                                : score >= 50 ? '#F7931A44' : '#ef444444'}`,
                        }}
                    >
                        <p
                            className="text-xs font-bold"
                            style={{
                                color: score >= 80 ? '#22c55e'
                                    : score >= 50 ? '#F7931A' : '#ef4444',
                            }}
                        >
                            {score >= 80
                                ? '🎉 Your portfolio is in great shape!'
                                : score >= 50
                                    ? '📈 Room to grow — check recommendations'
                                    : '⚠️ Take action to improve your score'}
                        </p>
                    </div>
                </div>

                {/* Issues + Wins */}
                <div className="lg:col-span-2 space-y-4">

                    {/* What's dragging score down */}
                    {issues.length > 0 && (
                        <div
                            className="rounded-2xl p-5"
                            style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                        >
                            <h2
                                className="font-display font-bold text-base mb-4 flex items-center gap-2"
                                style={{ color: s('text') }}
                            >
                                <span>⚠️</span> Dragging Your Score Down
                            </h2>
                            <div className="space-y-3">
                                {issues.map((issue, i) => (
                                    <div
                                        key={i}
                                        className="rounded-xl p-4"
                                        style={{
                                            background: '#ef444411',
                                            border: '1px solid #ef444433',
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <p
                                                className="text-sm font-bold"
                                                style={{ color: '#ef4444' }}
                                            >
                                                {issue.text}
                                            </p>
                                            <span
                                                className="text-xs font-mono font-black flex-shrink-0"
                                                style={{ color: '#ef4444' }}
                                            >
                                                {issue.impact}pts
                                            </span>
                                        </div>
                                        <p
                                            className="text-xs"
                                            style={{ color: s('muted') }}
                                        >
                                            💡 {issue.fix}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* What's working well */}
                    {wins.length > 0 && (
                        <div
                            className="rounded-2xl p-5"
                            style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                        >
                            <h2
                                className="font-display font-bold text-base mb-4 flex items-center gap-2"
                                style={{ color: s('text') }}
                            >
                                <span>✅</span> What's Working Well
                            </h2>
                            <div className="space-y-2">
                                {wins.map((win, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                                        style={{
                                            background: '#22c55e11',
                                            border: '1px solid #22c55e33',
                                        }}
                                    >
                                        <span className="text-green-400">✓</span>
                                        <p
                                            className="text-sm font-semibold"
                                            style={{ color: s('text') }}
                                        >
                                            {win}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
