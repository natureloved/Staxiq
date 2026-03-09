import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
    const { isDark } = useTheme();

    return (
        <footer
            className="border-t mt-16"
            style={{
                backgroundColor: isDark ? '#0d1117' : '#f1f5ff',
                borderColor: isDark ? '#1e2d4a' : '#dde5f5',
            }}
        >
            <div className="max-w-5xl mx-auto px-6 py-10 text-center">

                {/* Logo */}
                <div
                    className="font-logo font-black text-xl mb-2"
                    style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}
                >
                    Staxiq
                </div>

                {/* Tagline */}
                <p
                    className="text-sm mb-6"
                    style={{ color: isDark ? '#4a5a7a' : '#8899bb' }}
                >
                    Bitcoin DeFi Intelligence on Stacks
                </p>

                {/* Links */}
                <div className="flex items-center justify-center gap-6 mb-6 flex-wrap">
                    {[
                        { label: 'Stacks Explorer →', href: '#' },
                        { label: 'Docs →', href: '#' },
                    ].map((link, i) => (
                        <a
                            key={i}
                            href={link.href}
                            className="text-sm transition-colors"
                            style={{ color: isDark ? '#8899bb' : '#334155' }}
                            onMouseEnter={e => e.target.style.color = '#F7931A'}
                            onMouseLeave={e => e.target.style.color = isDark ? '#8899bb' : '#334155'}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Built on Bitcoin badge */}
                <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                    style={{
                        backgroundColor: isDark ? '#141c2e' : '#ffffff',
                        border: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                        color: isDark ? '#4a5a7a' : '#8899bb',
                    }}
                >
                    ₿ Built on Bitcoin · Powered by Stacks L2
                </div>

                <p
                    className="text-xs mt-6"
                    style={{ color: isDark ? '#2a3f6a' : '#c5d5f0' }}
                >
                    © 2026 Staxiq · Non-custodial · DYOR
                </p>
            </div>
        </footer>
    );
}
