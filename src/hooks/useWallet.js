import { useState, useEffect, useMemo } from 'react';
import { authenticate, AppConfig, UserSession } from '@stacks/connect';

export function useWallet() {
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
    const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);

    const isDev = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const getStxAddress = (userData) => {
        return isDev
            ? userData?.profile?.stxAddress?.testnet
            : userData?.profile?.stxAddress?.mainnet;
    };

    // Restore session on mount
    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            const addr = getStxAddress(userData);
            if (addr) {
                setAddress(addr);
                setConnected(true);
            }
        }
    }, [userSession]);

    function connectWallet() {
        setLoading(true);

        authenticate({
            appDetails: {
                name: 'Staxiq',
                icon: window.location.origin + '/favicon.ico',
            },
            userSession,
            onFinish: ({ userSession: session }) => {
                try {
                    const userData = session.loadUserData();
                    const addr = getStxAddress(userData);
                    if (addr) {
                        setAddress(addr);
                        setConnected(true);
                    }
                } catch (err) {
                    console.error('Error reading wallet data:', err);
                } finally {
                    setLoading(false);
                }
            },
            onCancel: () => {
                setLoading(false);
            },
        });
    }

    function disconnectWallet() {
        try { userSession.signUserOut(); } catch { }
        setConnected(false);
        setAddress(null);
    }

    function shortAddress(addr) {
        if (!addr) return '';
        return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
    }

    return { connected, address, shortAddress, connectWallet, disconnectWallet, loading };
}
