import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const STEPS = [
    {
        icon: '₿',
        title: 'Welcome to Staxiq',
        subtitle: 'Bitcoin DeFi Intelligence',
        description: 'The only AI-powered DeFi aggregator built natively on Stacks Bitcoin L2. See all your Bitcoin positions in one place.',
        cta: 'Get Started',
    },
    {
        icon: '🔗',
        title: 'Connect Your Wallet',
        subtitle: 'Non-custodial & Secure',
        description: 'Connect Xverse or Leather wallet. Staxiq never holds your funds — we only read your on-chain data to generate personalized strategies.',
        cta: 'Understood',
    },
    {
        icon: '🤖',
        title: 'Meet Your AI Copilot',
        subtitle: 'Powered by Gemini AI',
        description: 'Select your risk profile and get instant personalized DeFi strategies across Zest, ALEX, Bitflow, Hermetica and more. Every strategy is anchored on Bitcoin.',
        cta: 'Start Exploring',
    },
];

export default function Onboarding({ onComplete }) {
    const { isDark } = useTheme();
    const [step, setStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const visited = localStorage.getItem('staxiq-visited');
        if (!visited) setVisible(true);
    }, []);

    function handleNext() {
        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            localStorage.setItem('staxiq-visited', 'true');
            setVisible(false);
            onComplete?.();
        }
    }

    function handleSkip() {
        localStorage.setItem('staxiq-visited', 'true');
        setVisible(false);
    }

    if (!visible) return null;

    const current = STEPS[step];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                backgroundColor: isDark
                    ? 'rgba(10,14,26,0.95)'
                    : 'rgba(248,250,255,0.92)',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div
                className="relative w-full max-w-md rounded-2xl p-8 text-center"
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, #141c2e 0%, #0d1117 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f1f5ff 100%)',
                    border: `1px solid ${isDark ? '#2a3f6a' : '#dde5f5'}`,
                    boxShadow: isDark
                        ? '0 25px 50px rgba(0,0,0,0.6), 0 0 40px rgba(59,130,246,0.05)'
                        : '0 25px 50px rgba(0,0,0,0.1)',
                }}
            >
                {/* Skip */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 text-sm transition-colors"
                    style={{ color: isDark ? '#4a5a7a' : '#8899bb' }}
                    onMouseEnter={e => e.target.style.color = '#F7931A'}
                    onMouseLeave={e => e.target.style.color = isDark ? '#4a5a7a' : '#8899bb'}
                >
                    Skip →
                </button>

                {/* Icon */}
                <div
                    className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl"
                    style={{
                        background: 'linear-gradient(135deg, #F7931A22 0%, #F7931A11 100%)',
                        border: '1px solid #F7931A33',
                        boxShadow: '0 0 24px #F7931A22',
                    }}
                >
                    {current.icon}
                </div>

                {/* Step dots */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: i === step ? '24px' : '8px',
                                height: '8px',
                                backgroundColor: i === step
                                    ? '#F7931A'
                                    : isDark ? '#1e2d4a' : '#dde5f5',
                            }}
                        />
                    ))}
                </div>

                {/* Eyebrow */}
                <p
                    className="text-xs font-semibold tracking-widest uppercase mb-2"
                    style={{ color: '#F7931A' }}
                >
                    {current.subtitle}
                </p>

                {/* Title */}
                <h2
                    className="font-display text-2xl font-bold mb-4"
                    style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}
                >
                    {current.title}
                </h2>

                {/* Description */}
                <p
                    className="text-sm leading-relaxed mb-8"
                    style={{ color: isDark ? '#8899bb' : '#334155' }}
                >
                    {current.description}
                </p>

                {/* CTA */}
                <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl font-semibold text-white
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(135deg, #F7931A 0%, #e8820a 100%)',
                        boxShadow: '0 4px 15px #F7931A33',
                    }}
                >
                    {current.cta} →
                </button>

                {/* Counter */}
                <p
                    className="text-xs mt-4"
                    style={{ color: isDark ? '#4a5a7a' : '#8899bb' }}
                >
                    {step + 1} of {STEPS.length}
                </p>
            </div>
        </div>
    );
}
