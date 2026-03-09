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
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-200"
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
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-orange-500 px-2.5 py-1.5 rounded-lg">
                        <span className="text-white text-xs font-mono font-bold">
                            {shortAddress(address)}
                        </span>
                    </div>
                    <button
                        onClick={disconnectWallet}
                        className="text-[#4a5a7a] hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all duration-200 group flex-shrink-0"
                        title="Disconnect Wallet"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default WalletConnect;
