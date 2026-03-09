import { useState, useEffect, useMemo } from 'react';
import { showConnect, authenticate, AppConfig, UserSession } from '@stacks/connect';

export function useWallet() {
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    const appConfig = useMemo(() => new AppConfig(['store_write', 'publish_data']), []);
    const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);

    const getStxAddress = (session) => {
        if (!session.isUserSignedIn()) return null;
        const userData = session.loadUserData();
        const isDev = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        return isDev
            ? userData.profile.stxAddress.testnet
            : userData.profile.stxAddress.mainnet;
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
    }, [userSession]);

    function connectWallet() {
        try {
            setLoading(true);

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
                },
                onCancel: () => {
                    setLoading(false);
                },
            });

        } catch (err) {
            console.error('Wallet connect error:', err);
            setLoading(false);
        }
    }

    function disconnectWallet() {
        try {
            userSession.signUserOut();
        } catch {
            // Ignore disconnect errors
        }
        setConnected(false);
        setAddress(null);
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
        loading,
    };
}
