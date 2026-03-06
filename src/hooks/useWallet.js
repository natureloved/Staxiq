import { useState, useEffect, useCallback } from 'react';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';

export function useWallet() {
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadAddressFromStorage = useCallback(() => {
        try {
            const storage = getLocalStorage();
            const isDev = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';
            const addrs = storage?.addresses;
            const stxAddr = isDev
                ? addrs?.stx?.find(a => a.address.startsWith('ST'))?.address
                : addrs?.stx?.find(a => a.address.startsWith('SP'))?.address;
            return stxAddr || null;
        } catch {
            return null;
        }
    }, []);

    // Restore session on mount
    useEffect(() => {
        if (isConnected()) {
            const addr = loadAddressFromStorage();
            if (addr) {
                setAddress(addr);
                setConnected(true);
            }
        }
    }, [loadAddressFromStorage]);

    // ✅ Poll localStorage after connect() fires
    // connect() in v8 does NOT return a promise — it opens the wallet popup
    // and writes to localStorage when user approves. We poll until we see it.
    function pollForAddress(attempts = 0) {
        if (attempts > 20) {
            // Gave up after 10 seconds
            setLoading(false);
            return;
        }

        const addr = loadAddressFromStorage();

        if (addr) {
            setAddress(addr);
            setConnected(true);
            setLoading(false);
        } else {
            // Try again in 500ms
            setTimeout(() => pollForAddress(attempts + 1), 500);
        }
    }

    function connectWallet() {
        try {
            setLoading(true);

            connect({
                appDetails: {
                    name: 'Staxiq',
                    icon: window.location.origin + '/favicon.ico',
                },
                onFinish: () => {
                    // ✅ onFinish callback fires when user approves in Xverse
                    setTimeout(() => {
                        const addr = loadAddressFromStorage();
                        if (addr) {
                            setAddress(addr);
                            setConnected(true);
                        }
                        setLoading(false);
                    }, 300);
                },
                onCancel: () => {
                    // User closed the popup
                    setLoading(false);
                },
            });

            // ✅ Fallback: also poll in case onFinish doesn't fire
            // This handles older versions of Xverse
            setTimeout(() => pollForAddress(), 1000);

        } catch (err) {
            console.error('Wallet connect error:', err);
            setLoading(false);
        }
    }

    function disconnectWallet() {
        try {
            disconnect();
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
