import React from 'react';
import WalletConnect from './WalletConnect';
import PriceTicker from './PriceTicker';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ connected, address, connectWallet, disconnectWallet, loading }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="border-b dark:border-[#1e2d4a] border-gray-200 dark:bg-[#0a0e1a]/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
            <div className="hidden sm:block">
                <PriceTicker />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3 group cursor-pointer">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(247,147,26,0.5)] group-hover:scale-105 transition-transform duration-300">
                                <span className="text-gray-950 font-black text-xl font-logo">S</span>
                            </div>
                            {/* Heartbeat pulse */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 dark:border-gray-950 border-white shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
                        </div>
                        <span className="font-bold text-2xl tracking-tight dark:text-white text-gray-900 font-logo">Staxiq</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="relative w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 overflow-hidden group flex-shrink-0"
                            style={{
                                backgroundColor: isDark ? '#141c2e' : '#f1f5ff',
                                border: `1px solid ${isDark ? '#2a3f6a' : '#dde5f5'}`,
                            }}
                            aria-label="Toggle theme"
                        >
                            {/* Moon Icon */}
                            <svg
                                className="absolute w-4 h-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                style={{
                                    opacity: isDark ? 1 : 0,
                                    transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                                    color: isDark ? '#a8b8d8' : 'currentColor'
                                }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>

                            {/* Sun Icon */}
                            <svg
                                className="absolute w-4 h-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                style={{
                                    opacity: isDark ? 0 : 1,
                                    transform: isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
                                    color: !isDark ? '#4a5a7a' : 'currentColor'
                                }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>

                            {/* Hover effect border overlay */}
                            <div
                                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ border: `1px solid ${isDark ? '#4a5a7a' : '#c5d5f0'}` }}
                            />
                        </button>

                        <WalletConnect
                            connected={connected}
                            address={address}
                            connectWallet={connectWallet}
                            disconnectWallet={disconnectWallet}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
