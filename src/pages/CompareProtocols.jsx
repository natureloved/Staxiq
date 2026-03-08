import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useProtocolData } from '../hooks/useProtocolData';

const RISK_COLORS = {
    Low: { color: '#22c55e', bg: '#22c55e22', border: '#22c55e44' },
    Medium: { color: '#f59e0b', bg: '#f59e0b22', border: '#f59e0b44' },
    High: { color: '#ef4444', bg: '#ef444422', border: '#ef444444' },
};

function ProtocolLogo({ logo, name, color }) {
    const [err, setErr] = useState(false);
    if (err) {
        return (
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center
          text-xs font-black flex-shrink-0"
                style={{ background: `${color}33`, color, border: `1px solid ${color}55` }}
            >
                {name[0]}
            </div>
        );
    }
    return (
        <img
            src={logo}
            alt={name}
            onError={() => setErr(true)}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            style={{ border: `1px solid ${color}44` }}
        />
    );
}

export default function CompareProtocols() {
    const { isDark } = useTheme();
    const { protocols, loading, lastUpdated } = useProtocolData();
    const [sortBy, setSortBy] = useState('apy');
    const [sortDir, setSortDir] = useState('desc');
    const [filterRisk, setFilterRisk] = useState('All');
    const [filterType, setFilterType] = useState('All');

    const s = (val) => ({
        bg: isDark ? '#0d1117' : '#ffffff',
        card: isDark ? '#141c2e' : '#f8faff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#f0f4ff' : '#0a0e1a',
        muted: isDark ? '#8899bb' : '#334155',
        dim: isDark ? '#4a5a7a' : '#8899bb',
        row: isDark ? '#141c2e' : '#f8faff',
        rowAlt: isDark ? '#0d1117' : '#ffffff',
        hover: isDark ? '#1a2540' : '#f0f4ff',
    })[val];

    function toggleSort(col) {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('desc'); }
    }

    const sorted = [...protocols]
        .filter(p => filterRisk === 'All' || p.risk === filterRisk)
        .filter(p => filterType === 'All' || p.type === filterType)
        .sort((a, b) => {
            let av = a[sortBy], bv = b[sortBy];
            if (sortBy === 'tvl') { av = a.tvlRaw ?? 0; bv = b.tvlRaw ?? 0; }
            if (sortBy === 'risk') {
                const o = { Low: 1, Medium: 2, High: 3 };
                av = o[av]; bv = o[bv];
            }
            if (av == null) return 1;
            if (bv == null) return -1;
            return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });

    // Summary stats
    const withApy = protocols.filter(p => p.apy);
    const topApy = withApy.length ? withApy.reduce((a, b) => a.apy > b.apy ? a : b) : null;
    const topTvl = protocols.filter(p => p.tvlRaw).reduce((a, b) => (a.tvlRaw ?? 0) > (b.tvlRaw ?? 0) ? a : b, {});
    const audited = protocols.filter(p => p.audited).length;

    const SortIcon = ({ col }) => (
        <span style={{ color: sortBy === col ? '#F7931A' : s('dim'), fontSize: 10 }}>
            {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1
                        className="font-display font-bold text-3xl mb-1"
                        style={{ color: s('text') }}
                    >
                        Protocol Comparison
                    </h1>
                    <p style={{ color: s('muted'), fontSize: 14 }}>
                        Live data via DefiLlama · Updates every 5 minutes
                    </p>
                </div>
                {lastUpdated && (
                    <div
                        className="px-3 py-1.5 rounded-xl text-xs font-mono"
                        style={{
                            background: '#22c55e11',
                            border: '1px solid #22c55e33',
                            color: '#22c55e',
                        }}
                    >
                        🟢 Live · {lastUpdated.toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Filters */}
            <div
                className="rounded-2xl p-4 flex flex-wrap gap-4 items-center"
                style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
            >
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: s('dim') }}>Risk:</span>
                    {['All', 'Low', 'Medium', 'High'].map(r => (
                        <button key={r} onClick={() => setFilterRisk(r)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: filterRisk === r
                                    ? 'linear-gradient(135deg, #F7931A, #e8820a)'
                                    : s('card'),
                                color: filterRisk === r ? '#fff' : s('muted'),
                                border: `1px solid ${filterRisk === r ? 'transparent' : s('border')}`,
                            }}>{r}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: s('dim') }}>Type:</span>
                    {['All', 'Lending', 'DEX', 'Yield', 'Stacking'].map(t => (
                        <button key={t} onClick={() => setFilterType(t)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: filterType === t
                                    ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                                    : s('card'),
                                color: filterType === t ? '#fff' : s('muted'),
                                border: `1px solid ${filterType === t ? 'transparent' : s('border')}`,
                            }}>{t}</button>
                    ))}
                </div>
                {loading && (
                    <span
                        className="text-xs font-semibold ml-auto"
                        style={{ color: s('dim') }}
                    >
                        ⏳ Fetching live data…
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <div style={{ minWidth: '700px' }}>
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                    >
                        {/* Header row */}
                        <div
                            className="grid text-xs font-black uppercase tracking-widest px-5 py-3"
                            style={{
                                gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                                background: isDark ? '#141c2e' : '#f1f5ff',
                                color: s('dim'),
                                borderBottom: `1px solid ${s('border')}`,
                            }}
                        >
                            {[
                                { label: 'Protocol', col: 'name' },
                                { label: 'APY', col: 'apy' },
                                { label: 'TVL', col: 'tvl' },
                                { label: 'Risk', col: 'risk' },
                                { label: 'Type', col: null },
                                { label: 'Asset', col: null },
                                { label: 'Audited', col: null },
                                { label: 'Min Dep.', col: null },
                            ].map(({ label, col }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-1 cursor-pointer select-none"
                                    onClick={() => col && toggleSort(col)}
                                >
                                    {label}
                                    {col && <SortIcon col={col} />}
                                </div>
                            ))}
                        </div>

                        {/* Data rows */}
                        {sorted.map((p, i) => {
                            const risk = RISK_COLORS[p.risk] ?? RISK_COLORS.Medium;
                            return (
                                <div
                                    key={p.id}
                                    className="grid items-center px-5 py-4 transition-colors duration-150 cursor-pointer"
                                    style={{
                                        gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                                        background: i % 2 === 0 ? s('row') : s('rowAlt'),
                                        borderBottom: i < sorted.length - 1
                                            ? `1px solid ${s('border')}` : 'none',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = s('hover')}
                                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? s('row') : s('rowAlt')}
                                    onClick={() => window.open(p.url, '_blank')}
                                >
                                    {/* Name + logo */}
                                    <div className="flex items-center gap-3">
                                        <ProtocolLogo logo={p.logo} name={p.name} color={p.color} />
                                        <span
                                            className="font-bold text-sm font-creative"
                                            style={{ color: s('text') }}
                                        >
                                            {p.name}
                                            <span style={{ color: s('dim'), fontWeight: 400 }}> ↗</span>
                                        </span>
                                    </div>

                                    {/* APY */}
                                    <span className="font-mono font-black text-sm" style={{ color: '#F7931A' }}>
                                        {loading && p.apy == null
                                            ? <span style={{ color: s('dim') }}>…</span>
                                            : p.apyDisplay ?? '—'
                                        }
                                        {p.apySource === 'fallback' && p.apy && (
                                            <span
                                                title="Sourced from protocol's published rate"
                                                style={{ fontSize: 9, color: s('dim'), marginLeft: 4 }}
                                            >
                                                ~
                                            </span>
                                        )}
                                    </span>

                                    {/* TVL */}
                                    <span className="font-mono text-sm font-semibold" style={{ color: s('muted') }}>
                                        {loading && !p.tvlRaw
                                            ? <span style={{ color: s('dim') }}>…</span>
                                            : p.tvl ?? '—'
                                        }
                                    </span>

                                    {/* Risk badge */}
                                    <span
                                        className="text-xs font-bold px-2 py-1 rounded-full w-fit"
                                        style={{
                                            background: risk.bg,
                                            color: risk.color,
                                            border: `1px solid ${risk.border}`,
                                        }}
                                    >{p.risk}</span>

                                    {/* Type */}
                                    <span className="text-xs font-semibold" style={{ color: s('muted') }}>
                                        {p.type}
                                    </span>

                                    {/* Asset */}
                                    <span className="font-mono text-xs font-bold" style={{ color: '#3B82F6' }}>
                                        {p.asset}
                                    </span>

                                    {/* Audited */}
                                    <span style={{ color: p.audited ? '#22c55e' : '#ef4444', fontSize: 16 }}>
                                        {p.audited ? '✓' : '✗'}
                                    </span>

                                    {/* Min deposit */}
                                    <span className="text-xs font-mono" style={{ color: s('dim') }}>
                                        {p.minDeposit}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Highest APY',
                        value: topApy ? `${topApy.apy}%` : '—',
                        sub: topApy?.name ?? '—',
                        color: '#F7931A',
                    },
                    {
                        label: 'Largest TVL',
                        value: topTvl?.tvl ?? '—',
                        sub: topTvl?.name ?? '—',
                        color: '#3B82F6',
                    },
                    {
                        label: 'Protocols',
                        value: `${protocols.length}`,
                        sub: 'On Stacks',
                        color: '#22c55e',
                    },
                    {
                        label: 'Audited',
                        value: `${audited}/${protocols.length}`,
                        sub: 'Protocols',
                        color: '#8b5cf6',
                    },
                ].map((card, i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-4"
                        style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest mb-2"
                            style={{ color: s('dim') }}>{card.label}</p>
                        <p className="font-mono font-black text-xl" style={{ color: card.color }}>
                            {card.value}
                        </p>
                        <p className="text-xs mt-1 font-creative" style={{ color: s('muted') }}>{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* DefiLlama attribution */}
            <p className="text-xs text-center" style={{ color: s('dim') }}>
                Data sourced from{' '}
                <a
                    href="https://defillama.com/chain/Stacks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#F7931A]"
                >
                    DefiLlama
                </a>
                {' '}· TVL and APY update hourly
            </p>
        </div>
    );
}
