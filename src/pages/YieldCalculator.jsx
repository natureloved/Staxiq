import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    AreaChart, Area, XAxis, YAxis,
    Tooltip, ResponsiveContainer
} from 'recharts';

import { useProtocolData } from '../hooks/useProtocolData';

const RISK_COLORS = {
    Low: { color: '#22c55e', bg: '#22c55e22', border: '#22c55e44' },
    Medium: { color: '#f59e0b', bg: '#f59e0b22', border: '#f59e0b44' },
    High: { color: '#ef4444', bg: '#ef444422', border: '#ef444444' },
};

function calcReturns(amount, apy, compound = true) {
    const r = apy / 100;
    const calc = (t) => compound
        ? amount * Math.pow(1 + r / 365, 365 * t) - amount
        : amount * r * t;
    return {
        daily: calc(1 / 365),
        weekly: calc(7 / 365),
        monthly: calc(1 / 12),
        yearly: calc(1),
    };
}

function generateCurve(amount, apy, months = 12) {
    return Array.from({ length: months + 1 }, (_, i) => ({
        month: i === 0 ? 'Now' : `M${i}`,
        value: parseFloat(
            (amount * Math.pow(1 + apy / 100 / 12, i)).toFixed(2)
        ),
    }));
}

const CustomTooltip = ({ active, payload, isDark }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: isDark ? '#141c2e' : '#ffffff',
                border: `1px solid ${isDark ? '#2a3f6a' : '#dde5f5'}`,
                borderRadius: 10, padding: '8px 14px',
            }}>
                <p style={{ color: '#F7931A', fontFamily: 'monospace', fontWeight: 700 }}>
                    ${payload[0].value.toLocaleString()}
                </p>
                <p style={{ color: isDark ? '#8899bb' : '#334155', fontSize: 11 }}>
                    {payload[0].payload.month}
                </p>
            </div>
        );
    }
    return null;
};

export default function YieldCalculator({ connected }) {
    const { isDark } = useTheme();
    const [amount, setAmount] = useState('1000');
    const [asset, setAsset] = useState('STX');
    const { protocols: PROTOCOLS, loading } = useProtocolData();
    const [selectedProtocol, setSelectedProtocol] = useState(null);

    React.useEffect(() => {
        if (PROTOCOLS.length && !selectedProtocol) {
            setSelectedProtocol(PROTOCOLS[1] ?? PROTOCOLS[0]);
        }
    }, [PROTOCOLS]);
    const [compound, setCompound] = useState(true);
    const [stxPrice] = useState(0.26);
    const [btcPrice] = useState(68000);

    const usdAmount = useMemo(() => {
        const val = parseFloat(amount) || 0;
        return asset === 'STX' ? val * stxPrice : val * btcPrice;
    }, [amount, asset, stxPrice, btcPrice]);

    const returns = useMemo(() =>
        selectedProtocol ? calcReturns(usdAmount, selectedProtocol.apy, compound) : { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
        [usdAmount, selectedProtocol, compound]
    );

    const curve = useMemo(() =>
        selectedProtocol ? generateCurve(usdAmount, selectedProtocol.apy) : [],
        [usdAmount, selectedProtocol]
    );

    const breakEvenMonths = useMemo(() => {
        if (!selectedProtocol) return 0;
        // Time to grow 10% from initial
        return Math.ceil(
            Math.log(1.1) / Math.log(1 + selectedProtocol.apy / 100 / 12)
        );
    }, [selectedProtocol]);

    const risk = selectedProtocol ? RISK_COLORS[selectedProtocol.risk] : RISK_COLORS.Medium;

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
            <div>
                <h1
                    className="font-display font-bold text-3xl mb-1 flex items-center gap-2"
                    style={{ color: s('text') }}
                >
                    Yield Calculator
                </h1>
                <p style={{ color: s('muted'), fontSize: 14 }}>
                    Simulate your returns across every Stacks DeFi protocol before committing funds.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT — Input Panel */}
                <div
                    className="rounded-2xl p-6 space-y-5"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <h2
                        className="font-bold text-lg"
                        style={{ color: s('text'), fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                        Configure Investment
                    </h2>

                    {/* Amount + Asset */}
                    <div>
                        <label
                            className="block text-xs font-bold uppercase tracking-widest mb-2"
                            style={{ color: s('dim') }}
                        >
                            Investment Amount
                        </label>
                        <div
                            className="flex rounded-xl overflow-hidden"
                            style={{ border: `1px solid ${s('border')}` }}
                        >
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="flex-1 px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-lg font-mono font-bold outline-none min-w-0"
                                style={{
                                    background: s('card'),
                                    color: s('text'),
                                    borderRight: `1px solid ${s('border')}`,
                                }}
                                placeholder="0.00"
                                min="0"
                            />
                            <div className="flex flex-shrink-0">
                                {['STX', 'sBTC'].map(a => (
                                    <button
                                        key={a}
                                        onClick={() => setAsset(a)}
                                        className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap"
                                        style={{
                                            background: asset === a
                                                ? 'linear-gradient(135deg, #F7931A, #e8820a)'
                                                : s('card'),
                                            color: asset === a ? '#fff' : s('muted'),
                                        }}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p
                            className="text-xs mt-1.5 font-mono"
                            style={{ color: s('dim') }}
                        >
                            ≈ ${usdAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                        </p>
                    </div>

                    {/* Protocol Selector */}
                    <div>
                        <label
                            className="block text-xs font-bold uppercase tracking-widest mb-2"
                            style={{ color: s('dim') }}
                        >
                            Select Protocol
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {PROTOCOLS.map(p => (
                                <button
                                    key={p.name}
                                    onClick={() => setSelectedProtocol(p)}
                                    className="flex items-center justify-between px-4 py-3 rounded-xl
                    transition-all duration-200 text-left"
                                    style={{
                                        background: selectedProtocol?.name === p.name
                                            ? 'linear-gradient(135deg, #F7931A15, #F7931A08)'
                                            : s('card'),
                                        border: `1px solid ${selectedProtocol?.name === p.name
                                            ? '#F7931A55'
                                            : s('border')}`,
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={p.logo}
                                            alt={p.name}
                                            className="w-6 h-6 rounded-full object-cover"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                        <span
                                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={{
                                                background: RISK_COLORS[p.risk].bg,
                                                color: RISK_COLORS[p.risk].color,
                                                border: `1px solid ${RISK_COLORS[p.risk].border}`,
                                            }}
                                        >
                                            {p.risk.toUpperCase()}
                                        </span>
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: s('text') }}
                                        >
                                            {p.name}
                                        </span>
                                    </div>
                                    <span
                                        className="font-mono font-black text-sm"
                                        style={{ color: '#F7931A' }}
                                    >
                                        {p.apy ? `${p.apy}%` : '—'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Compound toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className="text-sm font-semibold"
                                style={{ color: s('text') }}
                            >
                                Compound Rewards
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: s('dim') }}
                            >
                                Reinvest earnings automatically
                            </p>
                        </div>
                        <button
                            onClick={() => setCompound(c => !c)}
                            className="relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-all duration-300"
                            style={{
                                background: compound
                                    ? 'linear-gradient(135deg, #F7931A, #e8820a)'
                                    : isDark ? '#1e2d4a' : '#dde5f5',
                            }}
                        >
                            <span
                                className="absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white transition-all duration-300"
                                style={{ left: compound ? (window.innerWidth < 640 ? '1.375rem' : '1.625rem') : '0.125rem' }}
                            />
                        </button>
                    </div>
                </div>

                {/* RIGHT — Results Panel */}
                <div className="space-y-4">

                    {selectedProtocol && (
                        <>
                            {/* Selected protocol summary */}
                            <div
                                className="rounded-2xl p-5"
                                style={{
                                    background: 'linear-gradient(135deg, #F7931A15, #F7931A05)',
                                    border: '1px solid #F7931A33',
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p
                                            className="font-display font-black text-2xl"
                                            style={{ color: '#F7931A' }}
                                        >
                                            {selectedProtocol.apy}% APY
                                        </p>
                                        <p
                                            className="text-sm font-semibold"
                                            style={{ color: s('muted') }}
                                        >
                                            {selectedProtocol.name} · {selectedProtocol.type}
                                        </p>
                                    </div>
                                    <div
                                        className="px-3 py-1.5 rounded-full text-xs font-black"
                                        style={{
                                            background: risk.bg,
                                            color: risk.color,
                                            border: `1px solid ${risk.border}`,
                                        }}
                                    >
                                        {selectedProtocol.risk} Risk
                                    </div>
                                </div>

                                {/* Return grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Daily', value: returns.daily },
                                        { label: 'Weekly', value: returns.weekly },
                                        { label: 'Monthly', value: returns.monthly },
                                        { label: 'Yearly', value: returns.yearly },
                                    ].map(({ label, value }) => (
                                        <div
                                            key={label}
                                            className="rounded-xl p-3"
                                            style={{
                                                background: isDark ? '#141c2e' : '#ffffff',
                                                border: `1px solid ${s('border')}`,
                                            }}
                                        >
                                            <p
                                                className="text-xs font-bold uppercase tracking-widest mb-1"
                                                style={{ color: s('dim') }}
                                            >
                                                {label}
                                            </p>
                                            <p
                                                className="font-mono font-black text-lg"
                                                style={{ color: '#22c55e' }}
                                            >
                                                +${value.toFixed(2)}
                                            </p>
                                            <p
                                                className="text-xs font-mono"
                                                style={{ color: s('dim') }}
                                            >
                                                {asset === 'STX'
                                                    ? `${(value / stxPrice).toFixed(2)} STX`
                                                    : `${(value / btcPrice).toFixed(6)} BTC`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Break-even */}
                            <div
                                className="rounded-2xl p-4 flex items-center gap-4"
                                style={{
                                    background: isDark ? '#0d1117' : '#ffffff',
                                    border: `1px solid ${s('border')}`,
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                                    style={{ background: '#3B82F622', border: '1px solid #3B82F633' }}
                                >
                                    ⏱️
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-bold"
                                        style={{ color: s('text') }}
                                    >
                                        Break-even in ~{breakEvenMonths} months
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: s('dim') }}
                                    >
                                        Time to grow your investment by 10% at {selectedProtocol.apy}% APY
                                    </p>
                                </div>
                            </div>

                            {/* Compound growth chart */}
                            <div
                                className="rounded-2xl p-5"
                                style={{
                                    background: isDark ? '#0d1117' : '#ffffff',
                                    border: `1px solid ${s('border')}`,
                                }}
                            >
                                <p
                                    className="font-bold text-sm mb-4"
                                    style={{ color: s('text'), fontFamily: "'Space Grotesk', sans-serif" }}
                                >
                                    12-Month Compound Growth
                                </p>
                                <ResponsiveContainer width="100%" height={140}>
                                    <AreaChart data={curve}>
                                        <defs>
                                            <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: s('dim'), fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={2}
                                        />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#F7931A"
                                            strokeWidth={2}
                                            fill="url(#yieldGrad)"
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#F7931A', strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
