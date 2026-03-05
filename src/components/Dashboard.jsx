import React from 'react';
import ProtocolCard from './ProtocolCard';
import AICopilot from './AICopilot';
import { usePortfolio } from '../hooks/usePortfolio';

const Dashboard = ({ connected, address }) => {
    const { portfolio, loading } = usePortfolio(address);
    const { stxBalance, sbtcBalance, totalUSD, txHistory } = portfolio;

    const truncate = (str, len) => str.length > len ? `${str.substring(0, len)}...` : str;

    if (!connected) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-bitcoin/5">
                    <svg className="w-10 h-10 text-bitcoin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Staxiq</h2>
                <p className="text-gray-400 text-center max-w-sm">Connect your Stacks wallet to view your DeFi portfolio, discover yield, and get AI strategies.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-5 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                    <p className="text-sm text-gray-400 font-medium mb-1 uppercase tracking-widest ml-2">STX Balance</p>
                    {loading ? (
                        <div className="animate-pulse bg-gray-800 h-8 w-24 rounded mt-1 ml-2"></div>
                    ) : (
                        <p className="text-3xl font-bold text-white ml-2">{stxBalance} <span className="text-lg text-gray-500 font-medium">STX</span></p>
                    )}
                </div>

                <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-5 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-bitcoin"></div>
                    <p className="text-sm text-gray-400 font-medium mb-1 uppercase tracking-widest ml-2">sBTC Balance</p>
                    {loading ? (
                        <div className="animate-pulse bg-gray-800 h-8 w-24 rounded mt-1 ml-2"></div>
                    ) : (
                        <p className="text-3xl font-bold text-white ml-2">{sbtcBalance} <span className="text-lg text-gray-500 font-medium">sBTC</span></p>
                    )}
                </div>

                <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-5 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                    <p className="text-sm text-gray-400 font-medium mb-1 uppercase tracking-widest ml-2">Total Value</p>
                    {loading ? (
                        <div className="animate-pulse bg-gray-800 h-8 w-32 rounded mt-1 ml-2"></div>
                    ) : (
                        <p className="text-3xl font-bold text-white ml-2"><span className="text-green-500">$</span>{totalUSD}</p>
                    )}
                </div>

                <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-5 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <p className="text-sm text-gray-400 font-medium mb-1 uppercase tracking-widest ml-2">Transactions</p>
                    {loading ? (
                        <div className="animate-pulse bg-gray-800 h-8 w-16 rounded mt-1 ml-2"></div>
                    ) : (
                        <p className="text-3xl font-bold text-white ml-2">{txHistory.length}</p>
                    )}
                </div>

            </div>

            <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-6 flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📈</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Advanced Charts Coming Soon</h3>
                    <p className="text-sm text-gray-500 mt-2">Historical portfolio performance will appear here.</p>
                </div>
            </div>

            <ProtocolCard />

            <AICopilot
                connected={connected}
                address={address}
                stxBalance={portfolio.stxBalance}
                sbtcBalance={portfolio.sbtcBalance}
                totalUSD={portfolio.totalUSD}
            />

            <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-gray-800 bg-gray-800/40">
                    <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500 text-sm font-medium animate-pulse">
                        Loading recent transactions...
                    </div>
                ) : txHistory.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm font-medium">
                        No recent transactions found on this account
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-800/60">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">TxID</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-800">
                                {txHistory.map((tx) => (
                                    <tr key={tx.txId} className="hover:bg-gray-800/60 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 capitalize font-semibold">
                                            {tx.type.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-400 font-mono">
                                            {tx.amount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'success' ? 'bg-green-900/50 text-green-400' :
                                                    tx.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                                                        'bg-red-900/50 text-red-400'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {tx.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <a
                                                href={tx.explorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 font-mono text-sm transition-colors"
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
};

export default Dashboard;
