import React from 'react';
import { useProtocols } from '../hooks/useProtocols';
import { FILTER_TYPES, RISK_STYLES } from '../services/protocolData';

const ProtocolCard = () => {
    const { protocols, filter, setFilter, loading } = useProtocols();

    return (
        <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-6 xl:p-8">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white">DeFi Protocols</h2>
                    <span className="text-sm font-medium text-gray-400 mt-1 block">Discover top opportunities across the Stacks ecosystem</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
                    {FILTER_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === type
                                    ? 'bg-bitcoin text-gray-950 shadow-[0_0_10px_rgba(247,147,26,0.2)]'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-gray-950 border border-gray-800 rounded-xl p-5 h-[280px] flex flex-col animate-pulse">
                            <div className="flex justify-between mb-6">
                                <div className="flex space-x-3">
                                    <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                                    <div className="w-24 h-6 bg-gray-800 rounded mt-2"></div>
                                </div>
                                <div className="w-16 h-6 bg-gray-800 rounded-full mt-2"></div>
                            </div>
                            <div className="w-20 h-10 bg-gray-800 rounded mb-4"></div>
                            <div className="flex space-x-4 mb-6">
                                <div className="w-full h-4 bg-gray-800 rounded"></div>
                                <div className="w-full h-4 bg-gray-800 rounded"></div>
                            </div>
                            <div className="w-full h-10 bg-gray-800 rounded-lg mt-auto"></div>
                        </div>
                    ))
                ) : protocols.length === 0 ? (
                    <div className="col-span-full py-12 text-center border border-dashed border-gray-800 rounded-xl bg-gray-950">
                        <p className="text-gray-400 font-medium">No protocols found matching this filter.</p>
                    </div>
                ) : (
                    protocols.map((protocol) => (
                        <div
                            key={protocol.id}
                            className="bg-gray-950 border border-gray-800 rounded-xl p-5 hover:border-gray-600 hover:shadow-xl transition-all duration-300 flex flex-col h-full group"
                        >

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-xl shadow-sm">
                                        {protocol.icon}
                                    </div>
                                    <h3 className="font-bold text-gray-100 text-lg group-hover:text-white transition-colors">{protocol.name}</h3>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${RISK_STYLES[protocol.risk]}`}>
                                    {protocol.risk}
                                </span>
                            </div>

                            <div className="mb-6 flex-grow">
                                <div className="mb-4">
                                    <span className="text-4xl font-black text-bitcoin tracking-tight">{protocol.apy}% <span className="text-sm font-semibold tracking-normal text-gray-500 uppercase">APY</span></span>
                                </div>

                                <div className="flex justify-between items-center text-sm py-3 border-y border-gray-800/60 w-full mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 font-medium mb-1">Asset</span>
                                        <span className="font-bold text-gray-200">{protocol.asset}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-gray-500 font-medium mb-1">TVL</span>
                                        <span className="font-bold text-gray-200">{protocol.tvl}</span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                    {protocol.description}
                                </p>
                            </div>

                            <a
                                href={protocol.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto w-full block text-center py-3 rounded-lg text-sm font-bold transition-all border border-gray-800 text-gray-300 hover:text-gray-950 hover:bg-gray-100"
                            >
                                View Protocol
                            </a>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
};

export default ProtocolCard;
