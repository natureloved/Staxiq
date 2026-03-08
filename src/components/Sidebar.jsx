import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
    { path: '/', label: 'Overview', badge: null },
    { path: '/yield', label: 'Yield Calculator', badge: 'NEW' },
    { path: '/stacking', label: 'Stacking Tracker', badge: 'NEW' },
    { path: '/health', label: 'Health Score', badge: 'NEW' },
    { path: '/compare', label: 'Compare Protocols', badge: 'NEW' },
    { path: '/achievements', label: 'Achievements', badge: null },
];

export default function Sidebar({ connected, isDemoMode, collapsed, setCollapsed }) {
    const { isDark } = useTheme();

    const s = {
        bg: isDark ? '#0d1117' : '#ffffff',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#8899bb' : '#64748b',
        textActive: '#F7931A',
        bgActive: isDark ? '#F7931A12' : '#FFF7ED',
        borderActive: '#F7931A44',
        dim: isDark ? '#2a3f6a' : '#e2e8f0',
        mutedBg: isDark ? '#141c2e' : '#f8faff',
    };

    return (
        <aside
            style={{
                width: collapsed ? '48px' : '220px',
                minHeight: '100vh',
                background: s.bg,
                borderRight: `1px solid ${s.border}`,
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
                zIndex: 10,
            }}
        >
            {/* ── Toggle button ───────────────────────────── */}
            <button
                onClick={() => setCollapsed(c => !c)}
                style={{
                    margin: '20px auto 24px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: `1px solid ${s.border}`,
                    background: s.mutedBg,
                    color: s.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'all 0.2s',
                }}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? '▶' : '◀'}
            </button>

            {/* ── Nav items ───────────────────────────────── */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 6px', flex: 1 }}>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '10px',
                            padding: collapsed ? '14px 0' : '10px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${isActive ? s.borderActive : 'transparent'}`,
                            background: isActive ? s.bgActive : 'transparent',
                            color: isActive ? s.textActive : s.text,
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: collapsed ? '64px' : 'auto',
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Active indicator bar on left */}
                                {isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '20%',
                                        height: '60%',
                                        width: '3px',
                                        borderRadius: '0 3px 3px 0',
                                        background: '#F7931A',
                                    }} />
                                )}

                                {collapsed ? (
                                    /* ── COLLAPSED: vertical rotated text ── */
                                    <div style={{
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'mixed',
                                        transform: 'rotate(180deg)',
                                        fontSize: '10px',
                                        fontWeight: isActive ? 800 : 600,
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        color: isActive ? s.textActive : s.text,
                                        userSelect: 'none',
                                        lineHeight: 1,
                                        paddingLeft: '2px',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {item.label}
                                    </div>
                                ) : (
                                    /* ── EXPANDED: normal horizontal text ── */
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flex: 1,
                                        minWidth: 0,
                                    }}>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: isActive ? 700 : 500,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {item.label}
                                        </span>
                                        {item.badge && (
                                            <span style={{
                                                fontSize: '8px',
                                                fontWeight: 900,
                                                padding: '2px 6px',
                                                borderRadius: '99px',
                                                background: 'linear-gradient(135deg, #F7931A, #e8820a)',
                                                color: '#fff',
                                                letterSpacing: '0.04em',
                                                flexShrink: 0,
                                            }}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* ── Bottom wallet status (expanded only) ──── */}
            {!collapsed && (
                <div style={{
                    margin: '0 6px 20px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: s.mutedBg,
                    border: `1px solid ${s.border}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: (connected || isDemoMode) ? (isDemoMode ? '#F7931A' : '#22c55e') : '#4a5a7a',
                            display: 'inline-block',
                            animation: (connected || isDemoMode) ? 'pulse 2s infinite' : 'none',
                            flexShrink: 0,
                        }} />
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: isDemoMode ? '#F7931A' : (connected ? '#22c55e' : s.text),
                        }}>
                            {isDemoMode ? 'Demo Mode Active' : (connected ? 'Wallet Connected' : 'Not Connected')}
                        </span>
                    </div>
                    <p style={{ fontSize: '10px', color: s.dim, margin: 0 }}>
                        {isDemoMode ? 'Previewing with mock data' : (connected ? 'Stacks Testnet' : 'Connect to access all features')}
                    </p>
                </div>
            )}

            {/* ── Bottom wallet status (collapsed only) ─── */}
            {collapsed && (
                <div style={{
                    margin: '0 auto 20px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: (connected || isDemoMode) ? (isDemoMode ? '#F7931A' : '#22c55e') : '#4a5a7a',
                    animation: (connected || isDemoMode) ? 'pulse 2s infinite' : 'none',
                    flexShrink: 0,
                }} />
            )}
        </aside>
    );
}

/* ── Mobile bottom nav ──────────────────────────────── */
export function MobileNav() {
    const { isDark } = useTheme();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
            style={{
                background: isDark ? '#0d1117' : '#ffffff',
                borderTop: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            {NAV_ITEMS.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    style={({ isActive }) => ({
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 4px',
                        textDecoration: 'none',
                        color: isActive ? '#F7931A' : isDark ? '#4a5a7a' : '#94a3b8',
                        borderTop: isActive ? '2px solid #F7931A' : '2px solid transparent',
                        transition: 'all 0.2s',
                    })}
                >
                    {({ isActive }) => (
                        <span style={{
                            fontSize: '9px',
                            fontWeight: isActive ? 800 : 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            textAlign: 'center',
                            lineHeight: 1.3,
                        }}>
                            {/* Split two-word labels onto two lines on mobile */}
                            {item.label.includes(' ')
                                ? item.label.split(' ').map((word, i) => (
                                    <span key={i} style={{ display: 'block' }}>{word}</span>
                                ))
                                : item.label
                            }
                        </span>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}

