// src/hooks/useWalletProtocols.js
import { useState, useEffect } from 'react';
import { detectWalletProtocols } from '../services/portfolioProtocols';

export function useWalletProtocols(address) {
    const [walletProtocols, setWalletProtocols] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!address) {
            setWalletProtocols([]);
            return;
        }
        setLoading(true);
        setError(null);
        detectWalletProtocols(address)
            .then(setWalletProtocols)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [address]);

    return { walletProtocols, loading, error };
}
