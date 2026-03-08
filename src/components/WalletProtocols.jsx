// src/components/WalletProtocols.jsx
// Shows detected DeFi protocol positions for the connected wallet

import { useTheme } from '../context/ThemeContext';
import { useDemo } from '../context/DemoContext';
import { useWalletProtocols } from '../hooks/useWalletProtocols';

export default function WalletProtocols({ address, demoProtocols }) {
    const { isDark } = useTheme();
    const { isDemoMode } = useDemo();

    // Use demo data in demo mode, live hook otherwise
    const { walletProtocols: liveProtocols, loading, error } =
        useWalletProtocols(isDemoMode ? null : address);

    const walletProtocols = isDemoMode ? (demoProtocols ?? []) : liveProtocols;
    const isLoading = isDemoMode ? false : loading;

    const s = {
        bg: isDark ? '#0d1117' : '#ffffff',
        card: isDark ? '#141c2e' : '#f8faff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#f0f4ff' : '#0a0e1a',
        muted: isDark ? '#8899bb' : '#64748b',
        dim: isDark ? '#4a5a7a' : '#94a3b8',
    };

    // ── Loading ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <div
                className="rounded-2xl p-6"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div>
                        <p className="font-bold text-base" style={{ color: s.text }}>
                            Your Active Positions
                        </p>
                        <p className="text-xs" style={{ color: s.dim }}>
                            Scanning Stacks blockchain…
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="h-16 rounded-xl animate-pulse"
                            style={{ background: s.card }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // ── No positions found ────────────────────────────────────
    if (!isLoading && walletProtocols.length === 0) {
        return (
            <div
                className="rounded-2xl p-6"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div>
                        <p className="font-bold text-base" style={{ color: s.text }}>
                            Your Active Positions
                        </p>
                        <p className="text-xs" style={{ color: s.dim }}>
                            No DeFi positions detected yet
                        </p>
                    </div>
                </div>
                <div
                    className="rounded-xl p-4 text-center"
                    style={{ background: s.card, border: `1px solid ${s.border}` }}
                >
                    <p className="text-sm mb-1" style={{ color: s.muted }}>
                        Your wallet hasn't interacted with any Stacks DeFi protocols yet.
                    </p>
                    <p className="text-xs" style={{ color: s.dim }}>
                        Use the AI Copilot below to get your first strategy →
                    </p>
                </div>
            </div>
        );
    }

    // ── Positions found ───────────────────────────────────────
    return (
        <div
            className="rounded-2xl p-6"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div>
                        <p className="font-bold text-base" style={{ color: s.text }}>
                            Your Active Positions
                        </p>
                        <p className="text-xs" style={{ color: s.dim }}>
                            {walletProtocols.length} protocol{walletProtocols.length > 1 ? 's' : ''} detected on Stacks
                        </p>
                    </div>
                </div>

                {/* Live badge */}
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                        background: '#22c55e11',
                        border: '1px solid #22c55e33',
                    }}
                >
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-green-400"
                        style={{ animation: 'pulse 2s infinite' }}
                    />
                    <span className="text-xs font-bold" style={{ color: '#22c55e' }}>
                        Live
                    </span>
                </div>
            </div>

            {/* Protocol cards */}
            <div className="space-y-3">
                {walletProtocols.map(protocol => (
                    <div
                        key={protocol.id}
                        className="rounded-xl p-4 flex items-center justify-between"
                        style={{
                            background: s.card,
                            border: `1px solid ${protocol.color}33`,
                            borderLeft: `3px solid ${protocol.color}`,
                        }}
                    >
                        <div className="flex items-center gap-3">
                            {/* Color dot */}
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm"
                                style={{
                                    background: `${protocol.color}18`,
                                    color: protocol.color,
                                    border: `1px solid ${protocol.color}33`,
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {protocol.name.slice(0, 2).toUpperCase()}
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm" style={{ color: s.text }}>
                                        {protocol.name}
                                    </p>
                                    {/* Confidence badge */}
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{
                                            background: protocol.confidence === 'confirmed'
                                                ? '#22c55e18' : '#f59e0b18',
                                            color: protocol.confidence === 'confirmed'
                                                ? '#22c55e' : '#f59e0b',
                                            border: `1px solid ${protocol.confidence === 'confirmed'
                                                ? '#22c55e33' : '#f59e0b33'}`,
                                            fontSize: '9px',
                                        }}
                                    >
                                        {protocol.confidence === 'confirmed' ? '✓ Confirmed' : '~ Likely'}
                                    </span>
                                </div>
                                <p className="text-xs" style={{ color: s.dim }}>
                                    {protocol.type} · {protocol.description}
                                </p>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="text-right">
                            <p
                                className="font-mono font-black text-sm"
                                style={{ color: protocol.color }}
                            >
                                {protocol.hasToken
                                    ? `${parseFloat(protocol.balanceNum.toFixed(4))} ${protocol.asset}`
                                    : '—'
                                }
                            </p>
                            <p className="text-xs" style={{ color: s.dim }}>
                                {protocol.hasToken ? 'Balance' : 'Previous activity'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer note */}
            <p className="text-xs text-center mt-4" style={{ color: s.dim }}>
                Detected via on-chain token balances · Read-only
            </p>
        </div>
    );
}
