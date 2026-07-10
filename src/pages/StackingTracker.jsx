import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDemo } from '../context/DemoContext';
import { DEMO_STACKING } from '../data/demoData';
import { API_BASE, assertApiConfigured } from '../services/apiConfig';
import { getSTXPrice, getBTCPrice } from '../services/stacksApi';

const CYCLE_DAYS = 14;

// Fallback only — used when the backend didn't return a real nextCycleAt.
function nextCycleDate() {
    const n = new Date();
    n.setDate(n.getDate() + CYCLE_DAYS);
    return n.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Projected per-cycle rewards over recent cycles, clearly labeled as
// estimates. Real per-cycle payout history isn't available yet, so these are
// flat projections from the current network APY — no fabricated variance.
function estimateEarnings(staked, apy, cycles, currentCycle, btcPerSTX) {
    if (staked <= 0 || currentCycle <= 0) return [];
    const perCycle = staked * apy / 26;
    return Array.from({ length: cycles }, (_, i) => {
        const cyclesAgo = i + 1;
        const d = new Date();
        d.setDate(d.getDate() - CYCLE_DAYS * cyclesAgo);
        return {
            cycle: currentCycle - cyclesAgo,
            stxEarned: parseFloat(perCycle.toFixed(2)),
            btcValue: parseFloat((perCycle * btcPerSTX).toFixed(6)),
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            status: 'Estimated',
        };
    });
}

function computeLive(stackingData, stxPrice, btcPrice) {
    const staked = stackingData?.totalStackedSTX || 0;
    const apy = stackingData?.networkApy ? parseFloat(stackingData.networkApy) : 0.07;
    const currentCycle = stackingData?.currentCycle || 0;
    const cyclesEst = Math.min(Math.max(currentCycle, 0), 5);

    const perCycleSTX = staked * apy / 26;
    const btcPerSTX = stxPrice > 0 && btcPrice > 0 ? stxPrice / btcPrice : 0;
    const btcPerCycle = perCycleSTX * btcPerSTX;

    const nextPayoutDate = stackingData?.nextCycleAt
        ? new Date(stackingData.nextCycleAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : nextCycleDate();

    return {
        stackedSTX: staked,
        totalSTXEarned: parseFloat((perCycleSTX * cyclesEst).toFixed(2)),
        totalBTCEarned: parseFloat((btcPerCycle * cyclesEst).toFixed(6)),
        currentCycle: currentCycle,
        // Real on-chain progress from the backend (/v2/pox); null when unknown
        cycleProgress: stackingData?.cycleProgress ?? null,
        nextPayoutSTX: parseFloat(perCycleSTX.toFixed(4)),
        nextPayoutDate,
        earnings: estimateEarnings(staked, apy, cyclesEst, currentCycle, btcPerSTX),
        positions: stackingData?.positions || [],
        apiError: false,
    };
}

export default function StackingTracker({ connected, address }) {
    const { isDark } = useTheme();
    const { isDemoMode } = useDemo();

    const [stackingData, setStackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stxPrice, setStxPrice] = useState(0);
    const [btcPrice, setBtcPrice] = useState(0);

    const fetchStacking = useCallback(async (signal) => {
        setLoading(true);
        setError('');
        try {
            assertApiConfigured();
            const res = await fetch(
                `${API_BASE}/api/stacking/${encodeURIComponent(address)}`,
                { signal }
            );
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setStackingData(data);
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (!connected || !address || isDemoMode) return;
        const controller = new AbortController();
        fetchStacking(controller.signal);
        return () => controller.abort();
    }, [connected, address, isDemoMode, fetchStacking]);

    useEffect(() => {
        let cancelled = false;
        async function fetchPrices() {
            const [stx, btc] = await Promise.all([getSTXPrice(), getBTCPrice()]);
            if (!cancelled) {
                setStxPrice(stx);
                setBtcPrice(btc);
            }
        }
        fetchPrices();
        return () => { cancelled = true; };
    }, []);

    const d = isDemoMode
        ? DEMO_STACKING
        : computeLive(stackingData, stxPrice, btcPrice);

    const noData = !isDemoMode && !stackingData && !loading && error;
    const showEmpty = !isDemoMode && noData;

    const s = (val) => ({
        bg: isDark ? '#0d1117' : '#ffffff',
        card: isDark ? '#141c2e' : '#f8faff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#f0f4ff' : '#0a0e1a',
        muted: isDark ? '#8899bb' : '#334155',
        dim: isDark ? '#4a5a7a' : '#8899bb',
    })[val];

    const stats = [
        { label: 'Stacked STX', value: d.stackedSTX.toLocaleString(), unit: 'STX', color: '#F7931A', icon: '' },
        { label: 'Est. STX Earned', value: d.totalSTXEarned, unit: 'STX', color: '#22c55e', icon: '' },
        { label: 'Est. BTC Earned', value: d.totalBTCEarned, unit: 'BTC', color: '#F7931A', icon: '' },
        { label: 'Current Cycle', value: d.currentCycle ? `#${d.currentCycle}` : '—', unit: 'PoX cycle', color: '#3B82F6', icon: '' },
    ];

    if (!connected && !isDemoMode) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="font-display font-bold text-3xl mb-2"
                    style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}>
                    Stacking Tracker
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

    if (showEmpty) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="font-display font-bold text-3xl mb-2"
                    style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}>
                    Stacking Tracker
                </h1>
                <div
                    className="rounded-2xl p-12 text-center mt-6"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <p className="text-4xl mb-4">📊</p>
                    <p className="font-semibold mb-2" style={{ color: s('text') }}>
                        Could not load stacking data
                    </p>
                    <p className="text-sm mb-4" style={{ color: s('muted') }}>
                        {error || 'Make sure the backend is reachable and your address has stacked STX.'}
                    </p>
                    <button
                        onClick={() => fetchStacking()}
                        className="px-6 py-2 rounded-xl font-bold text-white text-sm"
                        style={{ background: '#F7931A' }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (loading && !stackingData) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="font-display font-bold text-3xl mb-1"
                        style={{ color: s('text') }}>Stacking Tracker</h1>
                    <p style={{ color: s('muted'), fontSize: 14 }}>Loading stacking data…</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="rounded-2xl p-4 animate-pulse"
                             style={{ background: s('bg'), border: `1px solid ${s('border')}` }}>
                            <div className="h-3 w-16 rounded-full mb-3"
                                 style={{ background: isDark ? '#1e2d4a' : '#e2e8f0' }} />
                            <div className="h-8 w-20 rounded-lg"
                                 style={{ background: isDark ? '#1e2d4a' : '#e2e8f0' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1
                    className="font-display font-bold text-3xl mb-1"
                    style={{ color: s('text') }}
                >
                    Stacking Tracker
                </h1>
                <p style={{ color: s('muted'), fontSize: 14 }}>
                    Your live STX stacking position · reward figures are estimates from current network APY
                </p>
            </div>

            {error && (
                <div className="rounded-xl px-4 py-3 text-sm border border-yellow-900/50 bg-yellow-950/30 text-yellow-300">
                    ⚠️ {error}{!stackingData ? ' Showing estimated data.' : ''}
                </div>
            )}

            {/* Positions breakdown */}
            {(d.positions?.length ?? 0) > 0 && (
                <div
                    className="rounded-2xl p-5"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <h2 className="font-bold text-sm mb-3 uppercase tracking-widest"
                        style={{ color: s('dim') }}>
                        Your Positions
                    </h2>
                    <div className="space-y-2">
                        {d.positions.map((pos, i) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl"
                                 style={{ background: s('card'), border: `1px solid ${s('border')}` }}>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: s('text') }}>
                                        {pos.protocolSlug === 'pox-stacking' ? 'Native PoX' : 'StackingDAO'}
                                    </p>
                                    <p className="text-xs" style={{ color: s('muted') }}>
                                        {pos.kind}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-sm" style={{ color: s('text') }}>
                                        {parseFloat(pos.principal.amount || '0').toLocaleString()} {pos.principal.symbol}
                                    </p>
                                    {pos.apyTotal !== '0' && (
                                        <p className="text-xs" style={{ color: '#22c55e' }}>
                                            ~{(parseFloat(pos.apyTotal) * 100).toFixed(1)}% APY
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="rounded-2xl p-4"
                        style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest mb-2"
                           style={{ color: s('dim') }}>
                            {stat.label}
                        </p>
                        <p className="font-mono font-black text-2xl"
                           style={{ color: stat.color }}>
                            {stat.value}
                        </p>
                        <p className="text-xs font-semibold mt-1"
                           style={{ color: s('dim') }}>
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
                    <h2 className="font-bold text-lg mb-4"
                        style={{ color: s('text') }}>
                        Current Cycle Progress
                    </h2>

                    {d.cycleProgress != null ? (
                        <>
                            <div
                                className="w-full h-3 rounded-full mb-3 overflow-hidden"
                                style={{ background: isDark ? '#141c2e' : '#f1f5ff' }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${d.cycleProgress}%`,
                                        background: 'linear-gradient(90deg, #F7931A, #3B82F6)',
                                    }}
                                />
                            </div>

                            <div className="flex justify-between mb-6">
                                <span className="text-sm font-semibold"
                                      style={{ color: s('muted') }}>
                                    {d.cycleProgress}% complete
                                </span>
                                <span className="text-sm font-semibold"
                                      style={{ color: s('dim') }}>
                                    Cycle #{d.currentCycle}
                                </span>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm mb-6" style={{ color: s('muted') }}>
                            Cycle progress unavailable right now.
                        </p>
                    )}

                    {d.nextPayoutSTX > 0 && (
                        <div
                            className="rounded-xl p-4 flex items-center gap-4"
                            style={{
                                background: 'linear-gradient(135deg, #F7931A15, #F7931A05)',
                                border: '1px solid #F7931A33',
                            }}
                        >
                            <span className="text-3xl">⏳</span>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-1"
                                   style={{ color: '#F7931A' }}>
                                    Next Payout Estimate
                                </p>
                                <p className="font-mono font-black text-xl"
                                   style={{ color: s('text') }}>
                                    {d.nextPayoutSTX} STX
                                </p>
                                <p className="text-xs mt-0.5"
                                   style={{ color: s('dim') }}>
                                    {stxPrice > 0 && `≈ $${(d.nextPayoutSTX * stxPrice).toFixed(2)} USD · `}{d.nextPayoutDate}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Earnings breakdown */}
                <div
                    className="rounded-2xl p-6"
                    style={{ background: s('bg'), border: `1px solid ${s('border')}` }}
                >
                    <h2 className="font-bold text-lg mb-4"
                        style={{ color: s('text') }}>
                        Earnings Breakdown
                        <span className="text-xs font-semibold uppercase tracking-widest ml-2"
                              style={{ color: s('dim') }}>
                            {isDemoMode ? 'Demo' : 'Estimated'}
                        </span>
                    </h2>

                    {d.earnings.length > 0 ? (
                        <div className="space-y-2">
                            {d.earnings.slice(0, 5).map((row, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between py-2.5 rounded-xl px-4"
                                    style={{
                                        background: s('card'),
                                        border: `1px solid ${s('border')}`,
                                    }}
                                >
                                    <div>
                                        <p className="text-sm font-bold"
                                           style={{ color: s('text') }}>
                                            Cycle #{row.cycle}
                                        </p>
                                        <p className="text-xs"
                                           style={{ color: s('dim') }}>
                                            {row.date}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-sm"
                                           style={{ color: '#22c55e' }}>
                                            +{row.stxEarned} STX
                                        </p>
                                        <p className="font-mono text-xs"
                                           style={{ color: '#F7931A' }}>
                                            +{row.btcValue} BTC
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm py-4 text-center"
                           style={{ color: s('muted') }}>
                            No stacking history available yet.
                        </p>
                    )}

                    {d.totalSTXEarned > 0 && (
                        <div className="mt-4 pt-4 flex justify-between items-center"
                             style={{ borderTop: `1px solid ${s('border')}` }}>
                            <span className="text-sm font-black uppercase tracking-widest"
                                  style={{ color: s('muted') }}>
                                Total Earned
                            </span>
                            <div className="text-right">
                                <p className="font-mono font-black"
                                   style={{ color: '#22c55e' }}>
                                    +{d.totalSTXEarned} STX
                                </p>
                                <p className="font-mono text-xs"
                                   style={{ color: '#F7931A' }}>
                                    +{d.totalBTCEarned} BTC
                                </p>
                            </div>
                        </div>
                    )}
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
                    <p className="font-bold text-lg"
                       style={{ color: s('text') }}>
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
                    className="px-4 py-2 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] whitespace-nowrap"
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
