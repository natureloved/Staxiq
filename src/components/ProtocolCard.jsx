import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useProtocolData } from '../hooks/useProtocolData';
import { FILTER_TYPES, RISK_STYLES } from '../services/protocolData';

const ProtocolCard = () => {
    const { isDark } = useTheme();
    const { protocols, loading } = useProtocolData();
    const [filter, setFilter] = React.useState('All');

    return (
        <div className="w-full dark:bg-[#0d1117]/60 bg-white rounded-2xl shadow-xl border dark:border-[#1e2d4a] border-gray-200 p-4 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4 relative z-10">
                <div>
                    <h2 className="text-2xl font-black dark:text-white text-gray-900 font-creative">DeFi Protocols</h2>
                    <span className="text-sm font-bold dark:text-[#8899bb] text-[#4a5a7a] mt-1 block tracking-wide">Discover top yield opportunities across the Stacks ecosystem</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {FILTER_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-200"
                            style={{
                                background: filter === type
                                    ? 'linear-gradient(135deg, #F7931A, #e8820a)'
                                    : isDark ? '#141c2e' : '#f1f5ff',
                                color: filter === type
                                    ? '#ffffff'
                                    : isDark ? '#8899bb' : '#334155',
                                border: filter === type
                                    ? '1px solid transparent'
                                    : `1px solid ${isDark ? '#1e2d4a' : '#c5d5f0'}`,
                                boxShadow: filter === type
                                    ? '0 4px 12px #F7931A33'
                                    : 'none',
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
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
                ) : protocols.filter(p => filter === 'All' || p.type === filter).length === 0 ? (
                    <div className="col-span-full py-16 text-center border-2 border-dashed dark:border-[#1e2d4a] border-gray-300 rounded-2xl dark:bg-[#0a0e1a]/50 bg-gray-50">
                        <p className="dark:text-[#8899bb] text-[#4a5a7a] font-bold text-lg">No protocols found matching this filter.</p>
                    </div>
                ) : (
                    protocols
                        .filter(protocol => filter === 'All' || protocol.type === filter)
                        .map((protocol) => (
                            <div
                                key={protocol.id}
                                className="dark:bg-[#0a0e1a]/90 bg-white border dark:border-[#1e2d4a] border-gray-200 rounded-xl p-3 relative overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col h-full group"
                            >
                                {/* Hover accent ring */}
                                <div className="absolute inset-0 rounded-2xl border border-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-3 z-10 relative">
                                    <div className="flex items-center space-x-2.5">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                                            style={{
                                                background: isDark ? '#141c2e' : '#f1f5ff',
                                                border: `1px solid ${isDark ? '#1e2d4a' : '#dde5f5'}`,
                                            }}
                                        >
                                            <img
                                                src={protocol.logo}
                                                alt={protocol.name}
                                                className="w-5 h-5 object-contain"
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                        <h3 className="font-bold dark:text-[#f0f4ff] text-gray-900 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{protocol.name}</h3>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md ${RISK_STYLES[protocol.risk]}`}
                                    >
                                        {protocol.risk}
                                    </span>
                                </div>

                                <div className="mb-2 flex-grow z-10 relative">
                                    <div className="mb-2 flex items-end gap-1.5">
                                        <span className="text-2xl font-black text-orange-500 tracking-tight font-mono">{protocol.apyDisplay ?? '—'}</span>
                                        {/* APY Trend Indicator */}
                                        <div className="mb-1 flex items-center justify-center w-5 h-5 rounded-full dark:bg-green-900/30 bg-green-100 border dark:border-green-800/50 border-green-200">
                                            <span className="text-green-500 text-[10px] font-bold">↑</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] py-2 border-y dark:border-[#1e2d4a] border-gray-100 w-full mb-2">
                                        <div className="flex flex-col">
                                            <span className="dark:text-[#4a5a7a] text-[#8899bb] font-bold mb-0.5 uppercase tracking-wider text-xs">Asset</span>
                                            <span className="font-bold dark:text-[#d0d8f0] text-gray-800">{protocol.asset}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="dark:text-[#4a5a7a] text-[#8899bb] font-bold mb-0.5 uppercase tracking-wider text-xs">TVL</span>
                                            <span className="text-base font-bold dark:text-[#d0d8f0] text-gray-800 font-mono">{protocol.tvl}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs dark:text-[#8899bb] text-gray-600 leading-relaxed font-medium">
                                        {protocol.description}
                                    </p>
                                </div>

                                <div className="mt-auto relative z-10">
                                    <a
                                        href={protocol.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center py-2.5 rounded-lg text-xs font-bold transition-all duration-300 hover:scale-[1.02]"
                                        style={{
                                            background: 'linear-gradient(135deg, #F7931A, #e8820a)',
                                            color: '#fff',
                                            boxShadow: '0 4px 12px rgba(247,147,26,0.3)',
                                        }}
                                    >
                                        <span>View Strategy</span>
                                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
