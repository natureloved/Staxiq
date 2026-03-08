import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', badge: null },
    { path: '/yield', label: 'Yield Calculator', badge: null },
    { path: '/stacking', label: 'Stacking Tracker', badge: null },
    { path: '/health', label: 'Health Score', badge: null },
    { path: '/compare', label: 'Compare Protocols', badge: null },
    { path: '/achievements', label: 'Achievements', badge: null },
];

export default function Sidebar({ connected, isDemoMode, collapsed, setCollapsed }) {
    const { isDark } = useTheme();

    const s = {
        bg: isDark ? 'rgba(13, 17, 23, 0.75)' : 'rgba(255, 255, 255, 0.8)',
        border: isDark ? '#1e2d4a' : '#dde5f5',
        text: isDark ? '#8899bb' : '#64748b',
        textActive: '#F7931A',
        bgActive: isDark ? '#F7931A15' : '#FFF7ED',
        borderActive: '#F7931A44',
        dim: isDark ? '#2a3f6a' : '#e2e8f0',
        mutedBg: isDark ? '#141c2e' : '#f8faff',
    };

    return (
        <aside
            style={{
                width: collapsed ? '72px' : '240px',
                height: 'calc(100vh - 88px)',
                background: s.bg,
                backdropFilter: 'blur(16px)',
                borderRight: `1px solid ${s.border}`,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'fixed',
                top: '88px',
                left: '0',
                zIndex: 50,
                boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.05)',
                borderRadius: '0',
            }}
        >
            {/* ── Header / Toggle ───────────────────────────── */}
            <div style={{
                padding: collapsed ? '20px 0' : '24px 20px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
            }}>
                {!collapsed && (
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        color: '#F7931A',
                    }}>
                        Explore Staxiq
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: `1px solid ${s.border}`,
                        background: s.mutedBg,
                        color: s.text,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 900,
                        transition: 'all 0.2s',
                    }}
                >
                    {collapsed ? '▶' : '◀'}
                </button>
            </div>

            {/* ── Nav items ───────────────────────────────── */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px' }}>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '14px',
                            padding: collapsed ? '0' : '10px 14px',
                            borderRadius: '14px',
                            border: `1px solid ${isActive ? s.borderActive : 'transparent'}`,
                            background: isActive ? s.bgActive : 'transparent',
                            color: isActive ? s.textActive : s.text,
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            minHeight: collapsed ? '48px' : 'auto',
                            position: 'relative',
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                {/* stylized orb icon from first letter */}
                                <div style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isActive ? '#F7931A' : s.mutedBg,
                                    color: isActive ? '#fff' : s.text,
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    flexShrink: 0,
                                    transition: 'all 0.3s',
                                    boxShadow: isActive ? '0 0 15px rgba(247,147,26,0.3)' : 'none',
                                    border: `1px solid ${isActive ? 'transparent' : s.border}`,
                                }}>
                                    {item.label[0]}
                                </div>

                                {!collapsed && (
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
                                        }}>
                                            {item.label}
                                        </span>
                                        {item.badge && (
                                            <span style={{
                                                fontSize: '7px',
                                                fontWeight: 900,
                                                padding: '2px 5px',
                                                borderRadius: '6px',
                                                background: '#F7931A',
                                                color: '#fff',
                                                letterSpacing: '0.05em',
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

            {/* ── Status Section ──────────────────────────── */}
            <div style={{ padding: '16px 12px 12px' }}>
                <div style={{
                    padding: '12px',
                    borderRadius: '16px',
                    background: isDark ? 'rgba(20,28,46,0.5)' : '#f8faff',
                    border: `1px solid ${s.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: collapsed ? 'center' : 'flex-start',
                    gap: '8px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: (connected || isDemoMode) ? (isDemoMode ? '#F7931A' : '#22c55e') : '#4a5a7a',
                            boxShadow: (connected || isDemoMode) ? `0 0 10px ${(connected || isDemoMode) ? (isDemoMode ? '#F7931A' : '#22c55e') : 'transparent'}66` : 'none',
                            animation: (connected || isDemoMode) ? 'pulse 2s infinite' : 'none',
                            flexShrink: 0,
                        }} />
                        {!collapsed && (
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: isDemoMode ? '#F7931A' : (connected ? '#22c55e' : s.text),
                            }}>
                                {isDemoMode ? 'Demo Mode' : (connected ? 'Wallet Connected' : 'Offline')}
                            </span>
                        )}
                    </div>
                    {!collapsed && (
                        <p style={{
                            fontSize: '9px',
                            color: s.text,
                            margin: 0,
                            lineHeight: 1.4,
                            opacity: 0.8,
                        }}>
                            {isDemoMode ? 'Demo Mode' : (connected ? 'Stacks Testnet Alpha' : 'Connect wallet to start')}
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}

/* ── Mobile bottom nav ──────────────────────────────── */
export function MobileNav() {
    const { isDark } = useTheme();

    return (
        <nav
            className="fixed bottom-4 left-4 right-4 z-50 flex md:hidden h-16 rounded-2xl items-center"
            style={{
                background: isDark ? 'rgba(13, 17, 23, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                padding: '0 8px',
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
                        height: '48px',
                        textDecoration: 'none',
                        color: isActive ? '#F7931A' : isDark ? '#4a5a7a' : '#94a3b8',
                        transition: 'all 0.2s',
                        borderRadius: '12px',
                        background: isActive ? (isDark ? 'rgba(247,147,26,0.1)' : 'rgba(247,147,26,0.05)') : 'transparent',
                    })}
                >
                    {({ isActive }) => (
                        <span style={{
                            fontSize: '14px',
                            fontWeight: isActive ? 800 : 600,
                            transition: 'all 0.2s',
                        }}>
                            {item.label[0]}
                        </span>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}
