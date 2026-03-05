import React from 'react';

const WalletConnect = ({ connected, address, connectWallet, disconnectWallet, loading }) => {
    function shortAddress(addr) {
        if (!addr) return '';
        return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
    }

    return (
        <div className="flex items-center gap-3">
            {!connected ? (
                <button
                    onClick={connectWallet}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition-all duration-200"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Connecting...
                        </span>
                    ) : 'Connect Wallet'}
                </button>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-sm font-mono">
                            {shortAddress(address)}
                        </span>
                    </div>
                    <button
                        onClick={disconnectWallet}
                        className="text-gray-500 hover:text-red-400 text-sm transition-colors"
                    >
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
};

export default WalletConnect;
