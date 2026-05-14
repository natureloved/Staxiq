import { createContext, useContext, useState, useEffect } from 'react';

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
    // Default to env var; fall back to mainnet so missing/typo never shows testnet
    const [network, setNetwork] = useState(() => {
        const saved = localStorage.getItem('staxiq_network');
        return saved || import.meta.env.VITE_STACKS_NETWORK || 'mainnet';
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
