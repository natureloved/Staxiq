import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import Sidebar, { MobileNav } from './Sidebar';

export default function DashboardLayout({ connected, isDemoMode, children }) {
    const { isDark } = useTheme();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className="flex items-start"
            style={{ minHeight: (connected || isDemoMode) ? 'calc(100vh - 88px)' : undefined }}
        >
            {/* Sidebar — desktop only */}
            {(connected || isDemoMode) && (
                <div className="hidden md:block">
                    <Sidebar
                        connected={connected}
                        isDemoMode={isDemoMode}
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                    />
                </div>
            )}

            {/* Main content */}
            <main
                className="flex-1 overflow-auto flex justify-center transition-all duration-300"
                style={{
                    background: isDark ? '#0a0e1a' : '#f8faff',
                    padding: (connected || isDemoMode) ? 'clamp(16px, 3vw, 32px)' : undefined,
                    paddingBottom: (connected || isDemoMode) ? '80px' : undefined,
                }}
            >
                <div
                    className="w-full transition-all duration-300"
                    style={{ maxWidth: ((connected || isDemoMode) && collapsed) ? 'calc(100% - 168px)' : '100%' }}
                >
                    {children}
                </div>
            </main>

            {/* Mobile bottom nav — shown only when connected or in demo */}
            {(connected || isDemoMode) && <MobileNav />}
        </div>
    );
}
