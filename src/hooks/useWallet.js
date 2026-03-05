import { useState, useEffect, useCallback } from 'react';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';

export function useWallet() {
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    // ✅ Extracted into reusable function
    const loadAddressFromStorage = useCallback(() => {
        const storage = getLocalStorage();
        const isDev = window.location.hostname === 'localhost';
        const addrs = storage?.addresses;
        const stxAddr = isDev
            ? addrs?.stx?.find(a => a.address.startsWith('ST'))?.address
            : addrs?.stx?.find(a => a.address.startsWith('SP'))?.address;
        return stxAddr || null;
    }, []);

    // On mount — restore session
    useEffect(() => {
        if (isConnected()) {
            const addr = loadAddressFromStorage();
            if (addr) {
                setAddress(addr);
                setConnected(true);
            }
        }
    }, [loadAddressFromStorage]);

    async function connectWallet() {
        try {
            setLoading(true);
            await connect({
                appDetails: {
                    name: 'Staxiq',
                    icon: window.location.origin + '/staxiq-logo.png',
                },
            });

            // ✅ KEY FIX: Read from localStorage AFTER connect resolves
            // Small timeout ensures wallet extension has written to storage
            setTimeout(() => {
                const addr = loadAddressFromStorage();
                if (addr) {
                    setAddress(addr);
                    setConnected(true);
                }
                setLoading(false);
            }, 300);

        } catch (err) {
            console.error('Wallet connect error:', err);
            setLoading(false);
        }
    }

    function disconnectWallet() {
        disconnect();
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
        loading
    };
}
