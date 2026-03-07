import React from 'react';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';

export default function DashboardLayout({ connected, children }) {
    const { isDark } = useTheme();

    return (
        <div
            className="flex"
            style={{ minHeight: 'calc(100vh - 88px)' }}
        >
            <Sidebar connected={connected} />
            <main
                className="flex-1 overflow-auto"
                style={{
                    background: isDark ? '#0a0e1a' : '#f8faff',
                    padding: '32px',
                }}
            >
                {children}
            </main>
        </div>
    );
}
