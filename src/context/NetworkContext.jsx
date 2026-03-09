import { createContext, useContext, useState, useEffect } from 'react';

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
    // Default to testnet as per user request
    const [network, setNetwork] = useState(() => {
        const saved = localStorage.getItem('staxiq_network');
        return saved || 'testnet';
    });

    useEffect(() => {
        localStorage.setItem('staxiq_network', network);
    }, [network]);

    const isTestnet = network === 'testnet';

    function toggleNetwork() {
        setNetwork(prev => prev === 'mainnet' ? 'testnet' : 'mainnet');
    }

    return (
        <NetworkContext.Provider value={{ network, isTestnet, setNetwork, toggleNetwork }}>
            {children}
        </NetworkContext.Provider>
    );
}

export const useNetwork = () => useContext(NetworkContext);
