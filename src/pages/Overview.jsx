import React from 'react';
import ProtocolCard from '../components/ProtocolCard';
import AICopilot from '../components/AICopilot';
import PortfolioChart from '../components/PortfolioChart';
import { useCountUp } from '../hooks/useCountUp';
import { usePortfolio } from '../hooks/usePortfolio';

export default function Overview({ connected, address }) {
    const { portfolio, loading } = usePortfolio(address);
    const { stxBalance, sbtcBalance, totalUSD, txHistory } = portfolio;

    // CountUp animations
    const animatedStx = useCountUp(stxBalance, 1500, 2);
    const animatedSbtc = useCountUp(sbtcBalance, 1500, 4);
    const animatedUsd = useCountUp(totalUSD, 1500, 2);
    const animatedTx = useCountUp(txHistory?.length || 0, 1000, 0);

    if (!connected) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-creative">
            {/* Portfolio Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">

                <div className="dark:bg-[#0d1117]/60 bg-white dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(247,147,26,0.03)] hover:shadow-[0_8px_30px_rgba(247,147,26,0.15)] transition-shadow duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 shadow-[0_0_10px_rgba(247,147,26,0.8)]"></div>
                    <p className="text-sm dark:text-[#8899bb] text-[#4a5a7a] font-bold mb-2 uppercase tracking-widest ml-3">STX Balance</p>
                    {loading ? (
                        <div className="animate-pulse dark:bg-[#141c2e] bg-gray-200 h-8 w-24 rounded mt-1 ml-3"></div>
                    ) : (
                        <p className="text-4xl font-black dark:text-white text-gray-900 ml-3 font-mono">
                            {animatedStx}
                            <span className="text-xl dark:text-[#4a5a7a] text-[#8899bb] font-bold ml-2 tracking-normal">STX</span>
                        </p>
                    )}
                </div>

                <div className="dark:bg-[#0d1117]/60 bg-white dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl transition-shadow duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400"></div>
                    <div className="flex items-center gap-2 mb-2 ml-3">
                        <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.965 24A11.964 11.964 0 0024 12V0H0v12a11.965 11.965 0 0011.965 12zm.849-5.462v-1.631c-2.31 0-3.955-1.284-4.227-3.414h1.791c.205 1.109 1.155 1.748 2.436 1.748 1.488 0 2.454-.77 2.454-1.859 0-1.121-1.026-1.589-2.736-2.185-2.035-.724-3.565-1.613-3.565-3.506 0-1.928 1.488-3.32 3.847-3.588V2.515h1.617v1.542c2.168.176 3.633 1.25 3.96 3.121h-1.78c-.281-1.018-1.229-1.533-2.18-1.533-1.4 0-2.352.69-2.352 1.739 0 1.052.79 1.484 2.502 2.08 2.305.819 3.799 1.765 3.799 3.693 0 2.068-1.503 3.518-4.008 3.84v1.541h-1.558z" />
                        </svg>
                        <p className="text-sm dark:text-[#8899bb] text-[#4a5a7a] font-bold uppercase tracking-widest">sBTC Balance</p>
                    </div>
                    {loading ? (
                        <div className="animate-pulse dark:bg-[#141c2e] bg-gray-200 h-8 w-24 rounded mt-1 ml-3"></div>
                    ) : (
                        <p className="text-4xl font-black dark:text-white text-gray-900 ml-3 font-mono">
                            {animatedSbtc}
                            <span className="text-xl dark:text-[#4a5a7a] text-[#8899bb] font-bold ml-2 tracking-normal">sBTC</span>
                        </p>
                    )}
                </div>

                <div className="dark:bg-[#0d1117]/60 bg-white dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl transition-shadow duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                    <p className="text-sm dark:text-[#8899bb] text-[#4a5a7a] font-bold mb-2 uppercase tracking-widest ml-3">Total Value</p>
                    {loading ? (
                        <div className="animate-pulse dark:bg-[#141c2e] bg-gray-200 h-8 w-32 rounded mt-1 ml-3"></div>
                    ) : (
                        <p className="text-4xl font-black dark:text-white text-gray-900 ml-3 font-mono">
                            <span className="text-green-500 mr-1">$</span>
                            {animatedUsd}
                        </p>
                    )}
                </div>

                <div className="dark:bg-[#0d1117]/60 bg-white dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-xl transition-shadow duration-300">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                    <p className="text-sm dark:text-[#8899bb] text-[#4a5a7a] font-bold mb-2 uppercase tracking-widest ml-3">Transactions</p>
                    {loading ? (
                        <div className="animate-pulse dark:bg-[#141c2e] bg-gray-200 h-8 w-16 rounded mt-1 ml-3"></div>
                    ) : (
                        <p className="text-4xl font-black dark:text-white text-gray-900 ml-3 font-mono">
                            {animatedTx}
                        </p>
                    )}
                </div>

            </div>

            {/* Portfolio Chart Section */}
            <PortfolioChart totalUSD={totalUSD} />

            <ProtocolCard />

            <AICopilot
                connected={connected}
                address={address}
                stxBalance={portfolio.stxBalance}
                sbtcBalance={portfolio.sbtcBalance}
                totalUSD={portfolio.totalUSD}
            />

            <div className="dark:bg-[#0d1117]/60 bg-white rounded-2xl shadow-xl dark:border-[#1e2d4a] border-gray-200 overflow-hidden mt-8">
                <div className="px-8 py-6 border-b dark:border-[#1e2d4a] border-gray-200 dark:bg-[#141c2e]/40 bg-gray-50">
                    <h2 className="text-2xl font-black dark:text-white text-gray-900 font-creative">Recent Transactions</h2>
                </div>

                {loading ? (
                    <div className="p-10 text-center dark:text-[#4a5a7a] text-[#8899bb] text-sm font-medium animate-pulse">
                        Loading recent transactions...
                    </div>
                ) : txHistory.length === 0 ? (
                    <div className="p-10 text-center dark:text-[#4a5a7a] text-[#8899bb] text-sm font-medium">
                        No recent transactions found on this account
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y dark:divide-gray-800 divide-gray-200">
                            <thead className="dark:bg-[#0d1117] bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-8 py-4 text-left text-xs font-bold dark:text-[#8899bb] text-[#4a5a7a] uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-8 py-4 text-left text-xs font-bold dark:text-[#8899bb] text-[#4a5a7a] uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-8 py-4 text-left text-xs font-bold dark:text-[#8899bb] text-[#4a5a7a] uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-8 py-4 text-left text-xs font-bold dark:text-[#8899bb] text-[#4a5a7a] uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-8 py-4 text-left text-xs font-bold dark:text-[#8899bb] text-[#4a5a7a] uppercase tracking-wider">TxID</th>
                                </tr>
                            </thead>
                            <tbody className="dark:bg-[#0a0e1a]/50 bg-white divide-y dark:divide-gray-800 divide-gray-100">
                                {txHistory.map((tx) => (
                                    <tr key={tx.txId} className="dark:hover:bg-[#0d1117] hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-5 whitespace-nowrap text-sm dark:text-[#d0d8f0] text-gray-700 capitalize font-bold">
                                            {tx.type.replace('_', ' ')}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-sm text-orange-500 font-mono font-bold">
                                            {tx.amount}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${tx.status === 'success' ? 'dark:bg-green-900/30 bg-green-100 dark:text-green-400 text-green-700 dark:border-green-800/50 border border-green-200' :
                                                tx.status === 'pending' ? 'dark:bg-yellow-900/30 bg-yellow-100 dark:text-yellow-400 text-yellow-700 dark:border-yellow-800/50 border border-yellow-200' :
                                                    'dark:bg-red-900/30 bg-red-100 dark:text-red-400 text-red-700 dark:border-red-800/50 border border-red-200'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-sm dark:text-[#8899bb] text-[#4a5a7a] font-medium">
                                            {tx.date}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <a
                                                href={tx.explorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-400 font-mono text-sm transition-colors font-bold"
                                            >
                                                {tx.shortTxId} ↗
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
