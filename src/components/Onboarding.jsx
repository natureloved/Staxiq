import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const STEPS = [
    {
        tag: 'Your Bitcoin. Your DeFi.',
        title: 'Everything Bitcoin DeFi, in one place',
        description: `Staxiq connects to your Stacks wallet and shows you exactly where your STX and sBTC are working across every Bitcoin DeFi protocol — stacking, lending, trading, earning — all on one screen.`,
        note: 'No signup. No email. Just connect your wallet.',
        gradient: 'linear-gradient(135deg, #F7931A22, #F7931A05)',
        borderColor: '#F7931A33',
        cta: 'Get Started',
    },
    {
        tag: '100% Non-Custodial',
        title: 'We read your wallet. We never touch your funds.',
        description: `Connect your Xverse or Leather wallet in one click. Staxiq only reads your on-chain data — your keys stay with you, your funds stay in your wallet. We can't move, spend, or access anything.`,
        note: 'Compatible with Xverse and Leather wallets.',
        gradient: 'linear-gradient(135deg, #3B82F622, #3B82F605)',
        borderColor: '#3B82F633',
        cta: 'Understood',
    },
    {
        tag: 'Powered by Gemini AI',
        title: 'Your personal Bitcoin DeFi advisor',
        description: `Tell Staxiq how much risk you're comfortable with. Our AI analyses your actual wallet balance and builds a plain-English strategy — which protocols to use, how much to put where, and exactly what to do first.`,
        note: 'Every strategy is permanently recorded on the Bitcoin blockchain via Stacks.',
        gradient: 'linear-gradient(135deg, #22c55e22, #22c55e05)',
        borderColor: '#22c55e33',
        cta: 'Start Exploring',
    },
];

const STEP_ICONS = ['₿', '🔒', '🤖'];

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
                className="relative w-full max-w-md rounded-2xl p-8"
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

                {/* Step card */}
                <div
                    className="rounded-2xl p-8 text-center"
                    style={{
                        background: STEPS[step].gradient,
                        border: `1px solid ${STEPS[step].borderColor}`,
                    }}
                >
                    {/* Tag line */}
                    <p
                        className="text-xs font-black uppercase tracking-widest mb-4"
                        style={{ color: isDark ? '#8899bb' : '#64748b' }}
                    >
                        {STEPS[step].tag}
                    </p>

                    {/* Icon — smaller, 48px */}
                    <div
                        className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-2xl mb-5"
                        style={{
                            background: STEPS[step].borderColor,
                            border: `1px solid ${STEPS[step].borderColor}`,
                        }}
                    >
                        {STEP_ICONS[step]}
                    </div>

                    {/* Title */}
                    <h3
                        className="font-bold text-xl mb-3 leading-tight"
                        style={{ color: isDark ? '#f0f4ff' : '#0a0e1a' }}
                    >
                        {STEPS[step].title}
                    </h3>

                    {/* Description */}
                    <p
                        className="text-sm leading-relaxed mb-4"
                        style={{ color: isDark ? '#8899bb' : '#64748b' }}
                    >
                        {STEPS[step].description}
                    </p>

                    {/* Note */}
                    <p
                        className="text-xs px-4 py-2 rounded-lg inline-block"
                        style={{
                            background: isDark ? '#0d111766' : '#ffffff88',
                            color: isDark ? '#4a5a7a' : '#94a3b8',
                            border: `1px solid ${STEPS[step].borderColor}`,
                        }}
                    >
                        {STEPS[step].note}
                    </p>
                </div>

                {/* CTA */}
                <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl font-semibold text-white mt-6
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(135deg, #F7931A 0%, #e8820a 100%)',
                        boxShadow: '0 4px 15px #F7931A33',
                    }}
                >
                    {STEPS[step].cta} →
                </button>

                {/* Counter */}
                <p
                    className="text-xs mt-4 text-center"
                    style={{ color: isDark ? '#4a5a7a' : '#8899bb' }}
                >
                    {step + 1} of {STEPS.length}
                </p>
            </div>
        </div>
    );
}
