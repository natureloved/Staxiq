import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDemo } from '../context/DemoContext';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
    const { isDark } = useTheme();
    const { enterDemo } = useDemo();
    const navigate = useNavigate();

    function handleTryDemo() {
        enterDemo();
        navigate('/');
    }

    return (
        <section className="relative overflow-hidden">

            {/* Animated grid background */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Radial glow */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, #F7931A 0%, transparent 70%)',
                }}
            />

            <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">

                {/* Status pill */}
                <div
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold
            tracking-wider uppercase px-3 py-1 rounded-full mb-8"
                    style={{
                        backgroundColor: isDark ? '#141c2e' : '#f1f5ff',
                        border: `1px solid ${isDark ? '#2a3f6a' : '#c5d5f0'}`,
                        color: '#3B82F6',
                    }}
                >
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-green-400"
                        style={{ animation: 'pulse 2s infinite' }}
                    />
                    Stacks L2 · Live on Testnet
                </div>

                {/* Heading */}
                <h1
                    className="font-display font-black leading-[1.1] tracking-tight mb-6"
                    style={{ fontSize: 'clamp(36px, 6vw, 60px)' }}
                >
                    <span
                        className="block"
                        style={{ color: isDark ? '#f0f4ff' : '#0a0e1a', fontFamily: "'Clash Display', sans-serif" }}
                    >
                        Your Bitcoin DeFi
                    </span>
                    <span
                        className="block"
                        style={{
                            fontFamily: "'Clash Display', sans-serif",
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #F7931A 0%, #e8820a 40%, #3B82F6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Intelligence Layer
                    </span>
                </h1>

                {/* Subtext */}
                <p
                    className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10"
                    style={{ color: isDark ? '#8899bb' : '#334155' }}
                >
                    Connect your wallet to get AI-powered strategies across the
                    Stacks ecosystem. Maximize your yield securely.
                </p>

                {/* Stats row */}
                <div
                    className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden w-full sm:w-auto sm:inline-grid"
                    style={{
                        background: isDark ? '#141c2e' : '#ffffff',
                        border: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                        boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
                    }}
                >
                    {[
                        { label: 'Ecosystem TVL', value: '$1.2B+', color: '#F7931A' },
                        { label: 'Live Protocols', value: '7', color: '#3B82F6' },
                        { label: 'Platform Fees', value: '0%', color: '#22c55e' },
                        { label: 'Network', value: 'Bitcoin L2', color: '#8899bb' },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="px-5 py-4 text-center"
                            style={{
                                borderRight: (i === 1 || i === 3) ? 'none' : `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                                borderBottom: i < 2 ? `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}` : 'none',
                            }}
                        >
                            <div
                                className="font-display font-black text-xl"
                                style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}
                            >
                                {stat.value}
                            </div>
                            <div
                                className="text-xs uppercase tracking-wider mt-1"
                                style={{ color: isDark ? '#4a5a7a' : '#8899bb' }}
                            >
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Try Demo Button */}
                <div className="mt-8 flex flex-col items-center justify-center gap-4">
                    <button
                        onClick={handleTryDemo}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
                        style={{
                            background: isDark ? '#1a2540' : '#f1f5ff',
                            border: `1px solid ${isDark ? '#2a3f6a' : '#c5d5f0'}`,
                            color: isDark ? '#f0f4ff' : '#0a0e1a',
                            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                    >
                        Try Demo Mode
                        <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-black ml-2"
                            style={{ background: '#F7931A', color: '#fff' }}
                        >
                            NO WALLET NEEDED
                        </span>
                    </button>
                    <p style={{ color: isDark ? '#4a5a7a' : '#8899bb', fontSize: 12 }}>
                        See a live preview with a sample portfolio
                    </p>
                </div>

            </div>
        </section>
    );
}
