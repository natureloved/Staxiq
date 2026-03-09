import { useState, useEffect } from 'react';
import { connect, disconnect, AppConfig, UserSession } from '@stacks/connect'; // ✅ v8 API

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function useWallet() {
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    const isDev = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const getStxAddress = (userData) => {
        return isDev
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

    async function connectWallet() {
        if (loading) return;
        setLoading(true);
        try {
            await connect({                     // ✅ v8: promise-based, no callbacks
                appDetails: {
                    name: 'Staxiq',
                    icon: window.location.origin + '/favicon.ico',
                },
                userSession,
            });

            if (userSession.isUserSignedIn()) {
                const userData = userSession.loadUserData();
                const addr = getStxAddress(userData);
                if (addr) {
                    setAddress(addr);
                    setConnected(true);
                }
            }
        } catch (err) {
            if (err?.message?.includes('cancel') || err?.message?.includes('closed')) {
                // User cancelled — not a real error
            } else {
                console.error('Wallet connection failed:', err);
            }
        } finally {
            setLoading(false);
        }
    }

    function disconnectWallet() {
        try {
            disconnect();                       // ✅ v8: use disconnect(), not signUserOut()
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
