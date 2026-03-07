import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', badge: null },
    { path: '/yield', label: 'Yield Calculator', badge: 'NEW' },
    { path: '/stacking', label: 'Stacking', badge: 'NEW' },
    { path: '/health', label: 'Health Score', badge: 'NEW' },
    { path: '/compare', label: 'Compare', badge: 'NEW' },
    { path: '/achievements', label: 'Achievements', badge: null },
];

export default function Sidebar({ connected, collapsed, setCollapsed }) {
    const { isDark } = useTheme();

    return (
        <aside
            className="flex flex-col transition-all duration-300 flex-shrink-0 z-10"
            style={{
                width: collapsed ? '64px' : '220px',
                minHeight: '100vh',
                background: isDark ? '#0d1117' : '#ffffff',
                borderRight: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                paddingTop: '24px',
            }}
        >
            {/* Custom Animated Toggle Button */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="mx-auto mb-6 w-8 h-8 rounded-xl flex flex-col items-center justify-center gap-[1.3px] transition-all duration-300 group hover:scale-105 active:scale-95 z-50 overflow-hidden relative"
                style={{
                    background: isDark ? 'linear-gradient(135deg, #141c2e, #0d1117)' : 'linear-gradient(135deg, #ffffff, #f1f5ff)',
                    border: `1px solid ${isDark ? '#2a3f6a' : '#dde5f5'}`,
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
                }}
                title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
                {/* Top Line */}
                <span
                    className="h-[1.5px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                        background: isDark ? '#a8b8d8' : '#334155',
                        transform: collapsed ? 'translateY(0) rotate(0deg)' : 'translateY(2.5px) rotate(45deg)',
                        width: '12px',
                    }}
                />

                {/* Middle Line (Drops downward and fades) */}
                <span
                    className="h-[1.5px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                        background: isDark ? '#a8b8d8' : '#334155',
                        opacity: collapsed ? 1 : 0,
                        transform: collapsed ? 'translateY(0)' : 'translateY(12px) scale(0)',
                        width: '12px',
                    }}
                />

                {/* Bottom Line */}
                <span
                    className="h-[1.5px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                        background: isDark ? '#a8b8d8' : '#334155',
                        transform: collapsed ? 'translateY(0) rotate(0deg)' : 'translateY(-2.5px) rotate(-45deg)',
                        width: '12px',
                    }}
                />

                {/* Hover Glow */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(247,147,26,0.15) 0%, transparent 70%)'
                    }}
                />
            </button>

            <nav className="flex flex-col gap-1 px-2">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
                        style={({ isActive }) => ({
                            background: isActive
                                ? 'linear-gradient(135deg, #F7931A22, #F7931A11)'
                                : 'transparent',
                            border: isActive
                                ? '1px solid #F7931A33'
                                : '1px solid transparent',
                            color: isActive
                                ? '#F7931A'
                                : isDark ? '#8899bb' : '#334155',
                        })}
                    >
                        {!collapsed && (
                            <div className="flex items-center justify-between flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate">
                                    {item.label}
                                </span>
                                {item.badge && (
                                    <span
                                        className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                        style={{
                                            background: 'linear-gradient(135deg, #F7931A, #e8820a)',
                                            color: 'white',
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        )}

                        {collapsed && (
                            <div
                                className="absolute left-14 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
                                style={{
                                    background: isDark ? '#141c2e' : '#ffffff',
                                    border: `1px solid ${isDark ? '#2a3f6a' : '#dde5f5'}`,
                                    color: isDark ? '#f0f4ff' : '#0a0e1a',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                }}
                            >
                                {item.label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {!collapsed && (
                <div
                    className="mt-auto mx-2 mb-4 p-3 rounded-xl"
                    style={{
                        background: isDark ? '#141c2e' : '#f1f5ff',
                        border: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                    }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                                background: connected ? '#22c55e' : '#4a5a7a',
                                animation: connected ? 'pulse 2s infinite' : 'none',
                            }}
                        />
                        <span
                            className="text-xs font-semibold"
                            style={{ color: connected ? '#22c55e' : isDark ? '#4a5a7a' : '#8899bb' }}
                        >
                            {connected ? 'Wallet Connected' : 'Not Connected'}
                        </span>
                    </div>
                    <p
                        className="text-[10px]"
                        style={{ color: isDark ? '#4a5a7a' : '#8899bb' }}
                    >
                        {connected ? 'Stacks Testnet' : 'Connect to access all features'}
                    </p>
                </div>
            )}
        </aside>
    );
}
