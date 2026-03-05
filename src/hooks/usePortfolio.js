import { useState, useEffect } from 'react';
import { getFullPortfolio } from '../services/stacksApi';

export function usePortfolio(address) {
    const [portfolio, setPortfolio] = useState({
        stxBalance: '--',
        sbtcBalance: '--',
        totalUSD: '--',
        txHistory: [],
        stxPrice: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!address) return;

        async function fetchPortfolio() {
            try {
                setLoading(true);
                setError(null);
                const data = await getFullPortfolio(address);
                setPortfolio(data);
            } catch (err) {
                setError('Failed to load portfolio data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchPortfolio();

        const interval = setInterval(fetchPortfolio, 30000);
        return () => clearInterval(interval);
    }, [address]);

    return { portfolio, loading, error };
}
