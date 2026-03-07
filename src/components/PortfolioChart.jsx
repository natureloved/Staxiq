import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

function generateChartData(currentValue) {
    const data = [];
    const days = 30;
    const baseValue = currentValue * 0.75;
    for (let i = days; i >= 0; i--) {
        const noise = (Math.random() - 0.4) * currentValue * 0.05;
        const trend = (currentValue - baseValue) * ((days - i) / days);
        data.push({
            day: i === 0 ? 'Today' : `${i}d`,
            value: parseFloat(Math.max(0, baseValue + trend + noise).toFixed(2)),
        });
    }
    return data.reverse();
}

const CustomTooltip = ({ active, payload, isDark }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: isDark ? '#141c2e' : '#ffffff',
                border: `1px solid ${isDark ? '#2a3f6a' : '#dde5f5'}`,
                borderRadius: '8px',
                padding: '6px 10px',
            }}>
                <p style={{ color: '#F7931A', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700 }}>
                    ${payload[0].value}
                </p>
                <p style={{ color: isDark ? '#8899bb' : '#334155', fontSize: 9 }}>
                    {payload[0].payload.day}
                </p>
            </div>
        );
    }
    return null;
};

export default function PortfolioChart({ totalUSD }) {
    const { isDark } = useTheme();
    const value = parseFloat(totalUSD) || 100;
    const data = useMemo(() => generateChartData(value), [value]);

    return (
        <div
            className="rounded-2xl p-4 mb-6 w-full max-w-[1000px] mx-auto"
            style={{
                background: isDark ? '#0d1117' : '#ffffff',
                border: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 w-full">
                <div>
                    <h3
                        className="font-display font-bold text-sm"
                        style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}
                    >
                        Portfolio Performance
                    </h3>
                    <p style={{ color: isDark ? '#4a5a7a' : '#8899bb', fontSize: 10, marginTop: 1 }}>
                        30-day overview
                    </p>
                </div>
                <span style={{
                    fontSize: 10, fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: '#22c55e22',
                    color: '#22c55e',
                    border: '1px solid #22c55e44',
                    padding: '3px 8px',
                    borderRadius: 99,
                }}>
                    ↑ +24.3%
                </span>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    {/* ✅ SVG defs go INSIDE AreaChart like this */}
                    <defs>
                        <linearGradient id="bitcoinGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="day"
                        tick={{ fill: isDark ? '#4a5a7a' : '#8899bb', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval={6}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#F7931A"
                        strokeWidth={2}
                        fill="url(#bitcoinGradient)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#F7931A', strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
