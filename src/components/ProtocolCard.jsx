import React from 'react';
import { useProtocols } from '../hooks/useProtocols';
import { FILTER_TYPES, RISK_STYLES } from '../services/protocolData';

const ProtocolCard = () => {
    const { protocols, filter, setFilter, loading } = useProtocols();

    return (
        <div className="dark:bg-[#0d1117]/60 bg-white rounded-2xl shadow-xl dark:border-[#1e2d4a] border-gray-200 p-6 xl:p-10 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 relative z-10">
                <div>
                    <h2 className="text-2xl font-black dark:text-white text-gray-900 font-display">DeFi Protocols</h2>
                    <span className="text-sm font-bold dark:text-[#8899bb] text-[#4a5a7a] mt-2 block tracking-wide">Discover top yield opportunities across the Stacks ecosystem</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 dark:bg-[#0a0e1a]/80 bg-gray-100 p-1.5 rounded-xl dark:border-[#1e2d4a] border-gray-200 shadow-inner">
                    {FILTER_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${filter === type
                                ? 'bg-orange-500 text-white shadow-[0_4px_12px_rgba(247,147,26,0.3)]'
                                : 'dark:text-[#8899bb] text-[#4a5a7a] hover:text-gray-900 dark:hover:text-white dark:hover:bg-[#141c2e] hover:bg-white border text-transparent dark:border-transparent border-transparent hover:border-gray-200'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">

                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="dark:bg-[#0a0e1a]/80 bg-gray-50 border dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 h-[320px] flex flex-col relative overflow-hidden group">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent dark:via-gray-800/40 via-white/60 to-transparent z-10"></div>
                            <div className="flex justify-between mb-6">
                                <div className="flex space-x-3">
                                    <div className="w-12 h-12 dark:bg-[#141c2e] bg-gray-200 rounded-full"></div>
                                    <div className="w-24 h-6 dark:bg-[#141c2e] bg-gray-200 rounded mt-3"></div>
                                </div>
                                <div className="w-16 h-6 dark:bg-[#141c2e] bg-gray-200 rounded-full mt-3"></div>
                            </div>
                            <div className="w-24 h-12 dark:bg-[#141c2e] bg-gray-200 rounded mb-4"></div>
                            <div className="flex space-x-4 mb-6">
                                <div className="w-full h-4 dark:bg-[#141c2e] bg-gray-200 rounded"></div>
                                <div className="w-full h-4 dark:bg-[#141c2e] bg-gray-200 rounded"></div>
                            </div>
                            <div className="w-full h-12 dark:bg-[#141c2e] bg-gray-200 rounded-xl mt-auto"></div>
                        </div>
                    ))
                ) : protocols.length === 0 ? (
                    <div className="col-span-full py-16 text-center border-2 border-dashed dark:border-[#1e2d4a] border-gray-300 rounded-2xl dark:bg-[#0a0e1a]/50 bg-gray-50">
                        <p className="dark:text-[#8899bb] text-[#4a5a7a] font-bold text-lg">No protocols found matching this filter.</p>
                    </div>
                ) : (
                    protocols.map((protocol) => (
                        <div
                            key={protocol.id}
                            className="dark:bg-[#0a0e1a]/90 bg-white border dark:border-[#1e2d4a] border-gray-200 rounded-2xl p-6 relative overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col h-full group"
                        >
                            {/* Hover accent ring */}
                            <div className="absolute inset-0 rounded-2xl border-2 border-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                            <div className="flex justify-between items-start mb-6 z-10 relative">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 dark:bg-[#0d1117] bg-gray-50 border dark:border-[#1e2d4a] border-gray-200 rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                        {protocol.icon}
                                    </div>
                                    <h3 className="font-bold dark:text-[#f0f4ff] text-gray-900 text-xl font-display">{protocol.name}</h3>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm ${RISK_STYLES[protocol.risk]} dark:bg-opacity-30 dark:border-opacity-50`}>
                                    {protocol.risk}
                                </span>
                            </div>

                            <div className="mb-6 flex-grow z-10 relative">
                                <div className="mb-5 flex items-end gap-2">
                                    <span className="text-5xl font-black text-orange-500 tracking-tight font-mono">{protocol.apy}%</span>
                                    {/* APY Trend Indicator */}
                                    <div className="mb-2 flex items-center justify-center w-6 h-6 rounded-full dark:bg-green-900/30 bg-green-100 border dark:border-green-800/50 border-green-200">
                                        <span className="text-green-500 text-xs font-bold">↑</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-sm py-4 border-y dark:border-[#1e2d4a] border-gray-100 w-full mb-4">
                                    <div className="flex flex-col">
                                        <span className="dark:text-[#4a5a7a] text-[#8899bb] font-bold mb-1 uppercase tracking-wider text-[11px]">Asset</span>
                                        <span className="font-bold dark:text-[#d0d8f0] text-gray-800">{protocol.asset}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="dark:text-[#4a5a7a] text-[#8899bb] font-bold mb-1 uppercase tracking-wider text-[11px]">TVL</span>
                                        <span className="font-bold dark:text-[#d0d8f0] text-gray-800 font-mono">{protocol.tvl}</span>
                                    </div>
                                </div>

                                <p className="text-sm dark:text-[#8899bb] text-gray-600 leading-relaxed font-medium">
                                    {protocol.description}
                                </p>
                            </div>

                            <div className="mt-auto relative z-10">
                                <a
                                    href={protocol.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center py-3.5 rounded-xl border-2 dark:border-[#1e2d4a] border-gray-200 dark:bg-[#0d1117] bg-gray-50 text-sm font-bold dark:text-[#a8b8d8] text-gray-700 transition-all duration-300 group-hover:border-transparent group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] shadow-sm"
                                >
                                    <span>View Strategy</span>
                                    <svg className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
};

export default ProtocolCard;
