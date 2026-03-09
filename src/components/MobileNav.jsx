// src/components/MobileNav.jsx
// Fixed bottom navigation bar — shown only on mobile (< md breakpoint)
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard' },
    { path: '/yield', label: 'Yield' },
    { path: '/stacking', label: 'Stacking' },
    { path: '/health', label: 'Health' },
    { path: '/compare', label: 'Compare' },
    { path: '/achievements', label: 'Awards' },
    { path: '/copilot', label: 'Copilot' },
];

const NAV_ICONS = {
    '/': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    '/yield': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    ),
    '/stacking': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    ),
    '/health': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    '/compare': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    '/achievements': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
    ),
    '/copilot': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
        </svg>
    ),
};

export default function MobileNav() {
    const { isDark } = useTheme();

    const bg = isDark ? '#0d1117' : '#ffffff';
    const border = isDark ? '#1e2d4a' : '#dde5f5';

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
            style={{
                background: bg,
                borderTop: `1px solid ${border}`,
                height: '60px',
                backdropFilter: 'blur(12px)',
            }}
        >
            {NAV_ITEMS.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
                    style={({ isActive }) => ({
                        color: isActive ? '#F7931A' : isDark ? '#4a5a7a' : '#94a3b8',
                        transition: 'color 0.2s',
                    })}
                >
                    {({ isActive }) => (
                        <div style={{
                            color: isActive ? '#F7931A' : isDark ? '#4a5a7a' : '#94a3b8',
                        }}>
                            {NAV_ICONS[item.path]}
                        </div>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}
