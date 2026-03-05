import React from 'react';
import WalletConnect from './WalletConnect';

const Navbar = ({ connected, address, connectWallet, disconnectWallet }) => {
    return (
        <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-bitcoin flex items-center justify-center shadow-[0_0_10px_rgba(247,147,26,0.4)]">
                            <span className="text-gray-950 font-black text-xl">S</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">Staxiq</span>
                    </div>
                    <div className="flex items-center">
                        <WalletConnect
                            connected={connected}
                            address={address}
                            connectWallet={connectWallet}
                            disconnectWallet={disconnectWallet}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
