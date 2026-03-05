import { useState, useEffect } from 'react';
import { PROTOCOLS } from '../services/protocolData';

export function useProtocols() {
    const [protocols, setProtocols] = useState(PROTOCOLS);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(false);

    const filtered = filter === 'All'
        ? protocols
        : protocols.filter(p => p.type === filter);

    const sorted = [...filtered].sort((a, b) =>
        parseFloat(b.apy) - parseFloat(a.apy)
    );

    useEffect(() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 800);
    }, [filter]);

    return { protocols: sorted, filter, setFilter, loading };
}
