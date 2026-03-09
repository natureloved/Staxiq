import { useState, useEffect } from 'react';
import { showConnect, AppConfig, UserSession } from '@stacks/connect';

// Initialize session outside hook to ensure persistence across renders
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function useWallet() {
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    const isDev = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const getStxAddress = (session) => {
        if (!session.isUserSignedIn()) return null;
        try {
            const userData = session.loadUserData();
            return isDev
                ? userData?.profile?.stxAddress?.testnet
                : userData?.profile?.stxAddress?.mainnet;
        } catch (e) {
            console.error('Error loading STX address:', e);
            return null;
        }
    };

    // Restore session on mount
    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            const addr = getStxAddress(userSession);
            if (addr) {
                setAddress(addr);
                setConnected(true);
            }
        }
    }, []);

    function connectWallet() {
        if (loading) return;
        setLoading(true);

        try {
            showConnect({
                userSession,
                appDetails: {
                    name: 'Staxiq',
                    icon: window.location.origin + '/favicon.ico',
                },
                onFinish: () => {
                    const addr = getStxAddress(userSession);
                    if (addr) {
                        setAddress(addr);
                        setConnected(true);
                    }
                    setLoading(false);
                    // Force a small delay then reload to ensure all contexts sync with localStorage
                    setTimeout(() => window.location.reload(), 100);
                },
                onCancel: () => {
                    setLoading(false);
                },
            });
        } catch (err) {
            console.error('Wallet connection initiation failed:', err);
            setLoading(false);
        }
    }

    function disconnectWallet() {
        try {
            userSession.signUserOut();
            setConnected(false);
            setAddress(null);
            window.location.reload();
        } catch (err) {
            console.error('Logout error:', err);
        }
    }

    function shortAddress(addr) {
        if (!addr) return '';
        return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
    }

    return {
        connected,
        address,
        shortAddress,
        connectWallet,
        disconnectWallet,
        loading
    };
}
