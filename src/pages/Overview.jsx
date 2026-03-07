import React from 'react';
import PortfolioCard from '../components/PortfolioCard';
import PortfolioChart from '../components/PortfolioChart';
import ProtocolCard from '../components/ProtocolCard';
import AICopilot from '../components/AICopilot';
import { usePortfolio } from '../hooks/usePortfolio';

export default function Overview({ connected, address }) {
    const {
        stxBalance, sbtcBalance, totalUSD,
        txCount, loading
    } = usePortfolio(address);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PortfolioCard
                connected={connected}
                loading={loading}
                stxBalance={stxBalance}
                sbtcBalance={sbtcBalance}
                totalUSD={totalUSD}
                txCount={txCount}
            />
            {connected && <PortfolioChart totalUSD={totalUSD} />}
            <ProtocolCard />
            {connected && (
                <AICopilot
                    connected={connected}
                    address={address}
                    stxBalance={stxBalance}
                    sbtcBalance={sbtcBalance}
                    totalUSD={totalUSD}
                />
            )}
        </div>
    );
}
