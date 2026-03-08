// src/hooks/useProtocolData.js
import { useState, useEffect } from 'react';
import { fetchAllProtocolData, PROTOCOL_META } from '../services/defiLlamaService';

export function useProtocolData() {
    const [protocols, setProtocols] = useState(PROTOCOL_META); // start with static
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                const data = await fetchAllProtocolData();
                if (!cancelled) {
                    setProtocols(data);
                    setLastUpdated(new Date());
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        // Refresh every 5 minutes
        const interval = setInterval(load, 5 * 60 * 1000);
        return () => { cancelled = true; clearInterval(interval); };
    }, []);

    return { protocols, loading, error, lastUpdated };
}
