import React from 'react';
import { useTheme } from '../context/ThemeContext';
export default function YieldCalculator() {
    const { isDark } = useTheme();
    return (
        <div style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}>
            <h1 className="font-display text-3xl font-bold mb-2">🧮 Yield Calculator</h1>
            <p style={{ color: isDark ? '#8899bb' : '#334155' }}>Coming soon...</p>
        </div>
    );
}
