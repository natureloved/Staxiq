import { useState, useEffect } from 'react';
import { authenticate, showConnect, AppConfig, UserSession } from '@stacks/connect';
import { createNetwork } from '@stacks/network';
import { useNetwork } from '../context/NetworkContext';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// Resolved once at module load — follows VITE_STACKS_NETWORK, falls back to mainnet
export const stacksNetwork = createNetwork(
    import.meta.env.VITE_STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet'
);

export function useWallet() {
    const { network } = useNetwork();
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    const getStxAddress = (userData) => {
        // Read from env var — same source of truth as stacksNetwork above
        return (import.meta.env.VITE_STACKS_NETWORK === 'testnet')
            ? userData?.profile?.stxAddress?.testnet
            : userData?.profile?.stxAddress?.mainnet;
    };

    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            const addr = getStxAddress(userData);
            if (addr) {
                setAddress(addr);
                setConnected(true);
            }
        }
    }, []);

    function connectWallet() {
        if (loading) return;
        setLoading(true);

        authenticate({
            userSession,
            appDetails: {
                name: 'Staxiq',
                icon: window.location.origin + '/logo.png',
            },
            onFinish: () => {
                const userData = userSession.loadUserData();
                const addr = getStxAddress(userData);

                if (addr) {
                    setAddress(addr);
                    setConnected(true);
                }
                setLoading(false);
            },
            onCancel: () => {
                setLoading(false);
            },
        });
    }

    function disconnectWallet() {
        try {
            userSession.signUserOut();
        } catch (err) {
            console.error('Logout error:', err);
        }
        setConnected(false);
        setAddress(null);
        window.location.reload();
    }

    function shortAddress(addr) {
        if (!addr) return '';
        return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
    }

    return { connected, address, shortAddress, connectWallet, disconnectWallet, loading };
}
