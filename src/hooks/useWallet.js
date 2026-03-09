import { useState, useEffect } from 'react';
import { authenticate, AppConfig, UserSession } from '@stacks/connect'; // ✅ authenticate, not showConnect

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function useWallet() {
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    const isDev = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const getStxAddress = (userData) => {
        try {
            return isDev
                ? userData?.profile?.stxAddress?.testnet
                : userData?.profile?.stxAddress?.mainnet;
        } catch (e) {
            console.error('Error loading STX address:', e);
            return null;
        }
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
                icon: window.location.origin + '/favicon.ico',
            },
            onFinish: ({ userSession: session }) => {  // ✅ read from payload
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
        try {
            userSession.signUserOut();
        } catch (err) {
            console.error('Logout error:', err);
        }
        setConnected(false);
        setAddress(null);
    }

    function shortAddress(addr) {
        if (!addr) return '';
        return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
    }

    return { connected, address, shortAddress, connectWallet, disconnectWallet, loading };
}
