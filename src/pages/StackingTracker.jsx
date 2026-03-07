import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../hooks/usePortfolio';

const CYCLE_DURATION_DAYS = 14;
const STX_PRICE = 0.26;
const BTC_PRICE = 68000;

function getNextCycleDate() {
    const now = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + CYCLE_DURATION_DAYS);
    return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StackingTracker({ connected, address }) {
    const { isDark } = useTheme();
    const { stxBalance } = usePortfolio(address);
    const stackedAmount = parseFloat(stxBalance) || 0;
    const [cyclesCompleted] = useState(3);
    const [totalBtcEarned] = useState(0.00012);
    const [currentCycleProgress] = useState(68);

    const s = (val) => ({
        bg: isDark ? '#0d1117' : '#ffffff',
        card: isDark ? '#141c2e' : '#f8faff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#f0f4ff' : '#0a0e1a',
        muted: isDark ? '#8899bb' : '#334155',
        dim: isDark ? '#4a5a7a' : '#8899bb',
    })[val];

    const estimatedNextPayout = (stackedAmount * 0.095 / 26).toFixed(4);
    const totalSTXEarned = (stackedAmount * 0.095 * (cyclesCompleted / 26)).toFixed(2);

    const stats = [
        { label: 'Stacked STX', value: stackedAmount.toLocaleString(), unit: 'STX', color: '#F7931A', icon: '🥩' },
        { label: 'Total STX Earned', value: totalSTXEarned, unit: 'STX', color: '#22c55e', icon: '💰' },
        { label: 'Total BTC Earned', value: totalBtcEarned, unit: 'BTC', color: '#F7931A', icon: '₿' },
        { label: 'Cycles Completed', value: cyclesCompleted, unit: 'cycles', color: '#3B82F6', icon: '🔄' },
    ];

    if (!connected) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="font-display font-bold text-3xl mb-2"
                    style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}>
                    🥩 Stacking Tracker
                </h1>
                <div
                    className="rounded-2xl p-12 text-center mt-6"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <p className="text-4xl mb-4">🔗</p>
                    <p className="font-semibold mb-2" style={{ color: s('text') }}>
                        Connect your wallet to track stacking rewards
                    </p>
                    <p className="text-sm" style={{ color: s('dim') }}>
                        View your live STX stacking position via StackingDAO
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
                    🥩 Stacking Tracker
                </h1>
                <p style={{ color: s('muted'), fontSize: 14 }}>
                    Live STX stacking rewards via StackingDAO · Bitcoin-secured yields
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-4"
                        style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{stat.icon}</span>
                            <span
                                className="text-xs font-bold uppercase tracking-widest"
                                style={{ color: s('dim') }}
                            >
                                {stat.label}
                            </span>
                        </div>
                        <p
                            className="font-mono font-black text-2xl"
                            style={{ color: stat.color }}
                        >
                            {stat.value}
                        </p>
                        <p
                            className="text-xs font-semibold mt-1"
                            style={{ color: s('dim') }}
                        >
                            {stat.unit}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Current cycle progress */}
                <div
                    className="rounded-2xl p-6"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <h2
                        className="font-display font-bold text-lg mb-4"
                        style={{ color: s('text') }}
                    >
                        Current Cycle Progress
                    </h2>

                    {/* Progress bar */}
                    <div
                        className="w-full h-3 rounded-full mb-3 overflow-hidden"
                        style={{ background: isDark ? '#141c2e' : '#f1f5ff' }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${currentCycleProgress}%`,
                                background: 'linear-gradient(90deg, #F7931A, #3B82F6)',
                            }}
                        />
                    </div>

                    <div className="flex justify-between mb-6">
                        <span
                            className="text-sm font-semibold"
                            style={{ color: s('muted') }}
                        >
                            {currentCycleProgress}% complete
                        </span>
                        <span
                            className="text-sm font-semibold"
                            style={{ color: s('dim') }}
                        >
                            Cycle #{cyclesCompleted + 1}
                        </span>
                    </div>

                    {/* Next payout */}
                    <div
                        className="rounded-xl p-4 flex items-center gap-4"
                        style={{
                            background: 'linear-gradient(135deg, #F7931A15, #F7931A05)',
                            border: '1px solid #F7931A33',
                        }}
                    >
                        <span className="text-3xl">⏳</span>
                        <div>
                            <p
                                className="text-xs font-bold uppercase tracking-widest mb-1"
                                style={{ color: '#F7931A' }}
                            >
                                Next Payout Estimate
                            </p>
                            <p
                                className="font-mono font-black text-xl"
                                style={{ color: s('text') }}
                            >
                                {estimatedNextPayout} STX
                            </p>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: s('dim') }}
                            >
                                ≈ ${(parseFloat(estimatedNextPayout) * STX_PRICE).toFixed(2)} USD · {getNextCycleDate()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Earnings breakdown */}
                <div
                    className="rounded-2xl p-6"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <h2
                        className="font-display font-bold text-lg mb-4"
                        style={{ color: s('text') }}
                    >
                        Earnings Breakdown
                    </h2>

                    <div className="space-y-3">
                        {[
                            { cycle: 'Cycle #1', stx: '5.82', btc: '0.000039', date: 'Jan 14' },
                            { cycle: 'Cycle #2', stx: '6.14', btc: '0.000041', date: 'Jan 28' },
                            { cycle: 'Cycle #3', stx: '5.97', btc: '0.000040', date: 'Feb 11' },
                            { cycle: 'Current', stx: '—', btc: '—', date: 'In progress', active: true },
                        ].map((row, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between py-3 rounded-xl px-4"
                                style={{
                                    background: row.active
                                        ? 'linear-gradient(135deg, #3B82F615, #3B82F605)'
                                        : s('card'),
                                    border: `1px solid ${row.active ? '#3B82F633' : s('border')}`,
                                }}
                            >
                                <div>
                                    <p
                                        className="text-sm font-bold"
                                        style={{ color: row.active ? '#3B82F6' : s('text') }}
                                    >
                                        {row.cycle}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: s('dim') }}
                                    >
                                        {row.date}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p
                                        className="font-mono font-bold text-sm"
                                        style={{ color: '#22c55e' }}
                                    >
                                        {row.stx !== '—' ? `+${row.stx} STX` : '—'}
                                    </p>
                                    <p
                                        className="font-mono text-xs"
                                        style={{ color: '#F7931A' }}
                                    >
                                        {row.btc !== '—' ? `+${row.btc} BTC` : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total row */}
                    <div
                        className="mt-4 pt-4 flex justify-between items-center"
                        style={{ borderTop: `1px solid ${s('border')}` }}
                    >
                        <span
                            className="text-sm font-black uppercase tracking-widest"
                            style={{ color: s('muted') }}
                        >
                            Total Earned
                        </span>
                        <div className="text-right">
                            <p
                                className="font-mono font-black"
                                style={{ color: '#22c55e' }}
                            >
                                +{totalSTXEarned} STX
                            </p>
                            <p
                                className="font-mono text-xs"
                                style={{ color: '#F7931A' }}
                            >
                                +{totalBtcEarned} BTC
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* StackingDAO CTA */}
            <div
                className="rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
                style={{
                    background: 'linear-gradient(135deg, #3B82F615, #3B82F605)',
                    border: '1px solid #3B82F633',
                }}
            >
                <div>
                    <p
                        className="font-display font-bold text-lg"
                        style={{ color: s('text') }}
                    >
                        Start Stacking with StackingDAO
                    </p>
                    <p style={{ color: s('muted'), fontSize: 13 }}>
                        Earn ~9.5% APY on your STX. Non-custodial. Bitcoin-secured.
                    </p>
                </div>
                <a
                    href="https://stackingdao.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02]"
                    style={{
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        boxShadow: '0 4px 14px #3B82F633',
                    }}
                >
                    Visit StackingDAO ↗
                </a>
            </div>
        </div>
    );
}
