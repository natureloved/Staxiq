import React from 'react';

const PortfolioCard = ({ connected, loading, stxBalance, sbtcBalance }) => {
    if (!connected) {
        return (
            <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-8 flex items-center justify-center min-h-[160px] h-full">
                <p className="text-gray-500 font-medium tracking-wide">Connect your wallet to view portfolio</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-6 h-full">
            <h2 className="text-lg font-bold text-white mb-5">Portfolio Summary</h2>

            {loading ? (
                <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl h-24"></div>
                    <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl h-24"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl flex flex-col justify-center transition hover:border-gray-600">
                        <p className="text-sm text-gray-400 font-medium mb-1 uppercase tracking-widest">STX Balance</p>
                        <p className="text-3xl font-bold text-white">{stxBalance} <span className="text-lg text-gray-500 font-medium">STX</span></p>
                    </div>

                    <div className="bg-bitcoin/10 border border-bitcoin/20 p-4 rounded-xl flex flex-col justify-center transition hover:border-bitcoin/40">
                        <p className="text-sm text-bitcoin font-semibold mb-1 uppercase tracking-widest">sBTC Balance</p>
                        <p className="text-3xl font-bold text-white">{sbtcBalance} <span className="text-lg text-gray-500 font-medium">sBTC</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioCard;
