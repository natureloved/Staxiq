import React from 'react';
import ProtocolCard from '../components/ProtocolCard';
import AICopilot from '../components/AICopilot';
import PortfolioChart from '../components/PortfolioChart';
import WalletProtocols from '../components/WalletProtocols';
import RecentTransactions from '../components/RecentTransactions';
import { useCountUp } from '../hooks/useCountUp';
import { usePortfolio } from '../hooks/usePortfolio';
import { useDemo } from '../context/DemoContext';
import { DEMO_WALLET, DEMO_STRATEGY, DEMO_PROTOCOLS_DETECTED } from '../data/demoData';

export default function Overview({ connected, address }) {
    const { isDemoMode, exitDemo } = useDemo();
    const { portfolio, loading: liveLoading } = usePortfolio(isDemoMode ? null : address);

    const displayData = isDemoMode ? {
        stxBalance: DEMO_WALLET.stxBalance,
        sbtcBalance: DEMO_WALLET.sbtcBalance,
        totalUSD: DEMO_WALLET.totalUSD,
        txHistory: [],
        txCount: DEMO_WALLET.txCount,
        loading: false,
    } : {
        stxBalance: portfolio.stxBalance,
        sbtcBalance: portfolio.sbtcBalance,
        totalUSD: portfolio.totalUSD,
        txHistory: portfolio.txHistory,
        txCount: portfolio.txHistory?.length || 0,
        loading: liveLoading,
    };

    const effectiveAddress = isDemoMode ? DEMO_WALLET.address : address;

    // CountUp animations
    const animatedStx = useCountUp(displayData.stxBalance, 1500, 2);
    const animatedSbtc = useCountUp(displayData.sbtcBalance, 1500, 4);
    const animatedUsd = useCountUp(displayData.totalUSD, 1500, 2);
    const animatedTx = useCountUp(displayData.txCount || 0, 1000, 0);

    if (!connected && !isDemoMode) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-creative">

            {/* Demo banner */}
            {isDemoMode && (
                <div
                    className="rounded-2xl px-5 py-3 flex items-center justify-between flex-wrap gap-3"
                    style={{
                        background: 'linear-gradient(135deg, #F7931A18, #3B82F618)',
                        border: '1px solid #F7931A44',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span style={{ fontSize: 20 }}>🎮</span>
                        <div>
                            <p className="font-bold text-sm" style={{ color: '#F7931A' }}>
                                Demo Mode Active
                            </p>
                            <p className="text-xs" style={{ color: '#8899bb' }}>
                                Showing a sample portfolio · Connect your wallet to see your real data
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={exitDemo}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: 'linear-gradient(135deg, #F7931A, #e8820a)', color: '#fff' }}
                    >
                        Connect Real Wallet →
                    </button>
                </div>
            )}

            {/* Portfolio Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 font-sans">

                <div className="dark:bg-[#0d1117]/60 bg-white dark:border-[#1e2d4a] border border-gray-200 rounded-2xl p-4 flex flex-col justify-center items-center sm:items-start relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(247,147,26,0.03)] hover:shadow-[0_8px_30px_rgba(247,147,26,0.15)] transition-shadow duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 shadow-[0_0_10px_rgba(247,147,26,0.8)]"></div>
                    <p className="text-xs sm:text-sm dark:text-[#8899bb] text-[#4a5a7a] font-bold mb-1 sm:mb-2 uppercase tracking-widest sm:ml-3">STX Balance</p>
                    {displayData.loading ? (
                        <div className="animate-pulse dark:bg-[#141c2e] bg-gray-200 h-8 w-24 rounded mt-1 sm:ml-3"></div>
                    ) : (
                        <p className="text-2xl sm:text-4xl font-black dark:text-white text-gray-900 sm:ml-3 font-mono">
                            {parseFloat(animatedStx)}
                            <span className="text-base sm:text-xl dark:text-[#4a5a7a] text-[#8899bb] font-bold ml-1 sm:ml-2 tracking-normal">STX</span>
                        </p>
                    )}
                </div>

                <div className="dark:bg-[#0d1117]/60 bg-white dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-4 sm:p-6 flex flex-col justify-center items-center sm:items-start relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl transition-shadow duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400"></div>
                    <div className="flex items-center gap-2 mb-1 sm:mb-2 sm:ml-3">
                        <p className="text-xs sm:text-sm dark:text-[#8899bb] text-[#4a5a7a] font-bold uppercase tracking-widest">sBTC Balance</p>
                    </div>
                    {displayData.loading ? (
                        <div className="animate-pulse dark:bg-[#141c2e] bg-gray-200 h-8 w-24 rounded mt-1 sm:ml-3"></div>
                    ) : (
                        <p className="text-2xl sm:text-4xl font-black dark:text-white text-gray-900 sm:ml-3 font-mono">
                            {animatedSbtc}
                            <span className="text-base sm:text-xl dark:text-[#4a5a7a] text-[#8899bb] font-bold ml-1 sm:ml-2 tracking-normal">sBTC</span>
                        </p>
                    )}
                </div>

                <div className="dark:bg-[#0d1117]/60 bg-white dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-4 sm:p-6 flex flex-col justify-center items-center sm:items-start relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl transition-shadow duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                    <p className="text-xs sm:text-sm dark:text-[#8899bb] text-[#4a5a7a] font-bold mb-1 sm:mb-2 uppercase tracking-widest sm:ml-3">Total Value</p>
                    {displayData.loading ? (
                        <div className="animate-pulse dark:bg-[#141c2e] bg-gray-200 h-8 w-32 rounded mt-1 sm:ml-3"></div>
                    ) : (
                        <p className="text-2xl sm:text-4xl font-black dark:text-white text-gray-900 sm:ml-3 font-mono">
                            <span className="text-green-500 mr-0.5 sm:mr-1">$</span>
                            {animatedUsd}
                        </p>
                    )}
                </div>

                <div className="dark:bg-[#0d1117]/60 bg-white dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-4 sm:p-6 flex flex-col justify-center items-center sm:items-start relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl transition-shadow duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                    <p className="text-xs sm:text-sm dark:text-[#8899bb] text-[#4a5a7a] font-bold mb-1 sm:mb-2 uppercase tracking-widest sm:ml-3">Transactions</p>
                    {displayData.loading ? (
                        <div className="animate-pulse dark:bg-[#141c2e] bg-gray-200 h-8 w-16 rounded mt-1 sm:ml-3"></div>
                    ) : (
                        <p className="text-2xl sm:text-4xl font-black dark:text-white text-gray-900 sm:ml-3 font-mono">
                            {animatedTx}
                        </p>
                    )}
                </div>

            </div>

            {/* Portfolio Chart Section */}
            <PortfolioChart totalUSD={displayData.totalUSD} />

            <ProtocolCard />

            {(connected || isDemoMode) && (
                <WalletProtocols
                    address={effectiveAddress}
                    demoProtocols={isDemoMode ? DEMO_PROTOCOLS_DETECTED : undefined}
                />
            )}

            <AICopilot
                connected={connected || isDemoMode}
                address={effectiveAddress}
                stxBalance={displayData.stxBalance}
                sbtcBalance={displayData.sbtcBalance}
                totalUSD={displayData.totalUSD}
                txCount={displayData.txCount}
                demoStrategy={isDemoMode ? DEMO_STRATEGY : null}
            />
            {(connected || isDemoMode) && (
                <RecentTransactions address={effectiveAddress} />
            )}
        </div>
    );
}
