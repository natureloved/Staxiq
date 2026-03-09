import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const ALL_BADGES = [
    {
        id: 'first_connect',
        icon: '🔗',
        title: 'Bitcoin Pioneer',
        description: 'Connected your Stacks wallet for the first time',
        color: '#F7931A',
        condition: (data) => data.connected,
    },
    {
        id: 'first_strategy',
        icon: '🤖',
        title: 'AI Strategist',
        description: 'Generated your first AI DeFi strategy',
        color: '#3B82F6',
        condition: (data) => data.strategyCount >= 1,
    },
    {
        id: 'strategy_anchored',
        icon: '⛓️',
        title: 'On-Chain Thinker',
        description: 'Anchored a strategy on Bitcoin via Stacks',
        color: '#F7931A',
        condition: (data) => data.strategyCount >= 1,
    },
    {
        id: 'defi_explorer',
        icon: '🧭',
        title: 'DeFi Explorer',
        description: 'Visited all 5 sections of Staxiq',
        color: '#22c55e',
        condition: (data) => data.pagesVisited >= 5,
    },
    {
        id: 'bitcoin_maximizer',
        icon: '₿',
        title: 'Bitcoin Maximizer',
        description: 'Holding sBTC in your wallet',
        color: '#F7931A',
        condition: (data) => parseFloat(data.sbtcBalance) > 0,
    },
    {
        id: 'risk_manager',
        icon: '🛡️',
        title: 'Risk Manager',
        description: 'Selected Conservative risk profile',
        color: '#22c55e',
        condition: (data) => data.riskProfile === 'Conservative',
    },
    {
        id: 'yield_hunter',
        icon: '📈',
        title: 'Yield Hunter',
        description: 'Used the Yield Calculator',
        color: '#8b5cf6',
        condition: (data) => data.usedCalculator,
    },
    {
        id: 'stacker',
        icon: '🥩',
        title: 'Stacker',
        description: 'Checked your Stacking Tracker',
        color: '#3B82F6',
        condition: (data) => data.usedStacking,
    },
    {
        id: 'health_check',
        icon: '💊',
        title: 'Health Conscious',
        description: 'Checked your Wallet Health Score',
        color: '#22c55e',
        condition: (data) => data.usedHealth,
    },
    {
        id: 'analyst',
        icon: '🔬',
        title: 'DeFi Analyst',
        description: 'Used the Protocol Comparison table',
        color: '#f59e0b',
        condition: (data) => data.usedCompare,
    },
    {
        id: 'portfolio_100',
        icon: '💵',
        title: 'Century Club',
        description: 'Portfolio value exceeded $100',
        color: '#22c55e',
        condition: (data) => data.totalUSD >= 100,
    },
    {
        id: 'power_user',
        icon: '⚡',
        title: 'Power User',
        description: 'Earned 5 or more badges',
        color: '#F7931A',
        condition: (data) => data.badgeCount >= 5,
    },
];

export default function Achievements({ connected, address }) {
    const { isDark } = useTheme();
    const [userData] = useState({
        connected: true,
        strategyCount: 3,
        pagesVisited: 5,
        sbtcBalance: '0.0000',
        riskProfile: 'Balanced',
        usedCalculator: true,
        usedStacking: true,
        usedHealth: true,
        usedCompare: true,
        totalUSD: 128.95,
        badgeCount: 0,
    });

    const earned = ALL_BADGES.filter(b => b.condition({
        ...userData,
        badgeCount: ALL_BADGES.filter(b2 => b2.condition(userData)).length,
    }));
    const locked = ALL_BADGES.filter(b => !b.condition({
        ...userData,
        badgeCount: earned.length,
    }));

    const s = (val) => ({
        bg: isDark ? '#0d1117' : '#ffffff',
        card: isDark ? '#141c2e' : '#f8faff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#f0f4ff' : '#0a0e1a',
        muted: isDark ? '#8899bb' : '#334155',
        dim: isDark ? '#4a5a7a' : '#8899bb',
    })[val];

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1
                        className="font-display font-bold text-3xl mb-1"
                        style={{ color: s('text') }}
                    >
                        Achievements
                    </h1>
                    <p style={{ color: s('muted'), fontSize: 14 }}>
                        Earn badges by exploring Staxiq and growing your Bitcoin DeFi portfolio.
                    </p>
                </div>
                <div
                    className="rounded-xl px-3 py-1.5 text-center"
                    style={{
                        background: 'linear-gradient(135deg, #F7931A22, #F7931A11)',
                        border: '1px solid #F7931A33',
                    }}
                >
                    <p
                        className="font-mono font-black text-xl"
                        style={{ color: '#F7931A' }}
                    >
                        {earned.length}/{ALL_BADGES.length}
                    </p>
                    <p
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: '#F7931A' }}
                    >
                        Badges Earned
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div
                className="rounded-2xl p-4"
                style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
            >
                <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: s('muted') }}>
                        Collection Progress
                    </span>
                    <span className="text-xs font-mono font-bold" style={{ color: '#F7931A' }}>
                        {Math.round((earned.length / ALL_BADGES.length) * 100)}%
                    </span>
                </div>
                <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ background: isDark ? '#141c2e' : '#f1f5ff' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${(earned.length / ALL_BADGES.length) * 100}%`,
                            background: 'linear-gradient(90deg, #F7931A, #3B82F6)',
                        }}
                    />
                </div>
            </div>

            {/* Earned badges */}
            {earned.length > 0 && (
                <div>
                    <h2
                        className="font-black text-lg mb-4"
                        style={{ color: s('text'), fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                        Earned ({earned.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {earned.map(badge => (
                            <div
                                key={badge.id}
                                className="rounded-2xl p-4 text-center transition-all hover:scale-[1.02]"
                                style={{
                                    background: `${badge.color}15`,
                                    border: `1px solid ${badge.color}44`,
                                    boxShadow: `0 4px 16px ${badge.color}22`,
                                }}
                            >
                                <div
                                    className="w-7 h-7 rounded-xl mx-auto mb-2 flex items-center justify-center text-base"
                                    style={{
                                        background: `${badge.color}22`,
                                        border: `1px solid ${badge.color}44`,
                                    }}
                                >
                                    {badge.icon}
                                </div>
                                <p
                                    className="font-display font-black text-sm mb-1"
                                    style={{ color: badge.color }}
                                >
                                    {badge.title}
                                </p>
                                <p
                                    className="text-xs leading-snug"
                                    style={{ color: s('muted') }}
                                >
                                    {badge.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked badges */}
            {locked.length > 0 && (
                <div>
                    <h2
                        className="font-black text-lg mb-4"
                        style={{ color: s('text'), fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                        Locked ({locked.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {locked.map(badge => (
                            <div
                                key={badge.id}
                                className="rounded-2xl p-4 text-center opacity-50"
                                style={{
                                    background: s('card'),
                                    border: `1px solid ${s('border')}`,
                                }}
                            >
                                <div
                                    className="w-7 h-7 rounded-xl mx-auto mb-2 flex items-center justify-center text-base grayscale"
                                    style={{
                                        background: isDark ? '#1e2d4a' : '#f1f5ff',
                                        border: `1px solid ${s('border')}`,
                                        filter: 'grayscale(1)',
                                    }}
                                >
                                    {badge.icon}
                                </div>
                                <p
                                    className="font-display font-black text-sm mb-1"
                                    style={{ color: s('muted') }}
                                >
                                    {badge.title}
                                </p>
                                <p
                                    className="text-xs leading-snug"
                                    style={{ color: s('dim') }}
                                >
                                    {badge.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
