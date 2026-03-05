import { useState } from 'react';
import { getAIStrategy } from '../services/aiService';
import { PROTOCOLS } from '../services/protocolData';

export function useAIAdvisor({ address, stxBalance, sbtcBalance, totalUSD }) {
    const [strategy, setStrategy] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [riskProfile, setRiskProfile] = useState('Balanced');

    async function fetchStrategy() {
        if (!address) return;
        try {
            setLoading(true);
            setError(null);
            setStrategy(null);
            const result = await getAIStrategy({
                address,
                stxBalance,
                sbtcBalance,
                totalUSD,
                riskProfile,
                protocols: PROTOCOLS,
            });
            setStrategy(result);
        } catch (err) {
            setError('Failed to generate strategy. Please try again.');
            console.error('AI strategy error:', err);
        } finally {
            setLoading(false);
        }
    }

    return {
        strategy,
        loading,
        error,
        riskProfile,
        setRiskProfile,
        fetchStrategy,
    };
}
