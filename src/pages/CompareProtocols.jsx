import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const PROTOCOLS = [
    { name: 'Zest Protocol', apy: 8.2, tvl: '$48.2M', risk: 'Low', type: 'Lending', asset: 'sBTC', audited: true, minDeposit: '0.001 sBTC', url: 'https://zestprotocol.com' },
    { name: 'StackingDAO', apy: 9.5, tvl: '$89.3M', risk: 'Low', type: 'Stacking', asset: 'STX', audited: true, minDeposit: '100 STX', url: 'https://stackingdao.com' },
    { name: 'Bitflow', apy: 12.4, tvl: '$31.7M', risk: 'Medium', type: 'DEX', asset: 'sBTC/STX', audited: true, minDeposit: 'None', url: 'https://bitflow.finance' },
    { name: 'ALEX Lab', apy: 15.1, tvl: '$124.5M', risk: 'Medium', type: 'DEX', asset: 'sBTC/STX', audited: true, minDeposit: 'None', url: 'https://alexlab.co' },
    { name: 'Hermetica', apy: 18.7, tvl: '$22.1M', risk: 'High', type: 'Yield', asset: 'sBTC', audited: false, minDeposit: '0.01 sBTC', url: 'https://hermetica.fi' },
    { name: 'Granite', apy: 7.8, tvl: '$18.6M', risk: 'Low', type: 'Lending', asset: 'sBTC', audited: true, minDeposit: '0.001 sBTC', url: 'https://granite.finance' },
    { name: 'Velar', apy: 11.3, tvl: '$14.2M', risk: 'Medium', type: 'DEX', asset: 'STX', audited: false, minDeposit: 'None', url: 'https://velar.co' },
];

const RISK_COLORS = {
    Low: { color: '#22c55e', bg: '#22c55e22', border: '#22c55e44' },
    Medium: { color: '#f59e0b', bg: '#f59e0b22', border: '#f59e0b44' },
    High: { color: '#ef4444', bg: '#ef444422', border: '#ef444444' },
};

const SORT_OPTIONS = ['apy', 'tvl', 'risk', 'name'];

export default function CompareProtocols() {
    const { isDark } = useTheme();
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
    })[val];

    function toggleSort(col) {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('desc'); }
    }

    const sorted = [...PROTOCOLS]
        .filter(p => filterRisk === 'All' || p.risk === filterRisk)
        .filter(p => filterType === 'All' || p.type === filterType)
        .sort((a, b) => {
            let av = a[sortBy], bv = b[sortBy];
            if (sortBy === 'tvl') {
                av = parseFloat(av.replace(/[$M]/g, ''));
                bv = parseFloat(bv.replace(/[$M]/g, ''));
            }
            if (sortBy === 'risk') {
                const order = { Low: 1, Medium: 2, High: 3 };
                av = order[av]; bv = order[bv];
            }
            return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });

    const SortIcon = ({ col }) => (
        <span style={{ color: sortBy === col ? '#F7931A' : s('dim'), fontSize: 10 }}>
            {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1
                    className="font-display font-bold text-3xl mb-1"
                    style={{ color: s('text') }}
                >
                    📊 Protocol Comparison
                </h1>
                <p style={{ color: s('muted'), fontSize: 14 }}>
                    Side-by-side comparison of all Stacks DeFi protocols. Click column headers to sort.
                </p>
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
                        <button
                            key={r}
                            onClick={() => setFilterRisk(r)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: filterRisk === r
                                    ? 'linear-gradient(135deg, #F7931A, #e8820a)'
                                    : s('card'),
                                color: filterRisk === r ? '#fff' : s('muted'),
                                border: `1px solid ${filterRisk === r ? 'transparent' : s('border')}`,
                            }}
                        >{r}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: s('dim') }}>Type:</span>
                    {['All', 'Lending', 'DEX', 'Yield', 'Stacking'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{
                                background: filterType === t
                                    ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                                    : s('card'),
                                color: filterType === t ? '#fff' : s('muted'),
                                border: `1px solid ${filterType === t ? 'transparent' : s('border')}`,
                            }}
                        >{t}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
            >
                {/* Table header */}
                <div
                    className="grid text-xs font-black uppercase tracking-widest px-5 py-3"
                    style={{
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
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

                {/* Rows */}
                {sorted.map((p, i) => (
                    <div
                        key={p.name}
                        className="grid items-center px-5 py-4 transition-all duration-150"
                        style={{
                            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                            background: i % 2 === 0 ? s('row') : s('rowAlt'),
                            borderBottom: i < sorted.length - 1
                                ? `1px solid ${s('border')}` : 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? '#1a2540' : '#f0f4ff'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? s('row') : s('rowAlt')}
                    >
                        {/* Name */}
                        <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-sm hover:text-[#F7931A] transition-colors"
                            style={{ color: s('text') }}
                        >
                            {p.name} ↗
                        </a>

                        {/* APY */}
                        <span
                            className="font-mono font-black text-sm"
                            style={{ color: '#F7931A' }}
                        >
                            {p.apy}%
                        </span>

                        {/* TVL */}
                        <span
                            className="font-mono text-sm font-semibold"
                            style={{ color: s('muted') }}
                        >
                            {p.tvl}
                        </span>

                        {/* Risk */}
                        <span
                            className="text-xs font-bold px-2 py-1 rounded-full w-fit"
                            style={{
                                background: RISK_COLORS[p.risk].bg,
                                color: RISK_COLORS[p.risk].color,
                                border: `1px solid ${RISK_COLORS[p.risk].border}`,
                            }}
                        >
                            {p.risk}
                        </span>

                        {/* Type */}
                        <span
                            className="text-xs font-semibold"
                            style={{ color: s('muted') }}
                        >
                            {p.type}
                        </span>

                        {/* Asset */}
                        <span
                            className="font-mono text-xs font-bold"
                            style={{ color: '#3B82F6' }}
                        >
                            {p.asset}
                        </span>

                        {/* Audited */}
                        <span style={{ color: p.audited ? '#22c55e' : '#ef4444', fontSize: 16 }}>
                            {p.audited ? '✓' : '✗'}
                        </span>

                        {/* Min deposit */}
                        <span
                            className="text-xs font-mono"
                            style={{ color: s('dim') }}
                        >
                            {p.minDeposit}
                        </span>
                    </div>
                ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Highest APY', value: '18.7%', sub: 'Hermetica', color: '#F7931A' },
                    { label: 'Largest TVL', value: '$124.5M', sub: 'ALEX Lab', color: '#3B82F6' },
                    { label: 'Lowest Risk', value: '7.8%', sub: 'Granite', color: '#22c55e' },
                    { label: 'Most Audited', value: '5/7', sub: 'Protocols', color: '#8b5cf6' },
                ].map((card, i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-4"
                        style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                    >
                        <p
                            className="text-xs font-bold uppercase tracking-widest mb-2"
                            style={{ color: s('dim') }}
                        >
                            {card.label}
                        </p>
                        <p
                            className="font-mono font-black text-xl"
                            style={{ color: card.color }}
                        >
                            {card.value}
                        </p>
                        <p
                            className="text-xs mt-1"
                            style={{ color: s('muted') }}
                        >
                            {card.sub}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
