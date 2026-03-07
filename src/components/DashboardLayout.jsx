import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';

export default function DashboardLayout({ connected, children }) {
    const { isDark } = useTheme();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className="flex"
            style={{ minHeight: 'calc(100vh - 88px)' }}
        >
            <Sidebar connected={connected} collapsed={collapsed} setCollapsed={setCollapsed} />
            <main
                className="flex-1 overflow-auto flex justify-center transition-all duration-300"
                style={{
                    background: isDark ? '#0a0e1a' : '#f8faff',
                    padding: '32px',
                }}
            >
                <div
                    className="w-full transition-all duration-300"
                    style={{ maxWidth: collapsed ? 'calc(100% - 156px)' : '100%' }}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
