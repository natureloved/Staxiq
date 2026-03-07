import { useState, useEffect } from 'react';

export default function PriceTicker() {
    const [prices, setPrices] = useState({
        btc: { usd: '--', change: 0 },
        stx: { usd: '--', change: 0 },
        sbtc: 1.0001,
    });

    useEffect(() => {
        async function fetchPrices() {
            try {
                const res = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,blockstack&vs_currencies=usd&include_24hr_change=true'
                );
                const data = await res.json();
                setPrices({
                    btc: {
                        usd: data.bitcoin?.usd?.toLocaleString() || '--',
                        change: data.bitcoin?.usd_24h_change?.toFixed(2) || 0,
                    },
                    stx: {
                        usd: data.blockstack?.usd?.toFixed(3) || '--',
                        change: data.blockstack?.usd_24h_change?.toFixed(2) || 0,
                    },
                    sbtc: 1.0001,
                });
            } catch (err) {
                console.warn('Price fetch failed:', err);
            }
        }

        fetchPrices();
        // Refresh every 60 seconds
        const interval = setInterval(fetchPrices, 60_000);
        return () => clearInterval(interval);
    }, []);

    const items = [
        { label: 'BTC/USD', value: `$${prices.btc.usd}`, change: prices.btc.change },
        { label: 'STX/USD', value: `$${prices.stx.usd}`, change: prices.stx.change },
        { label: 'sBTC/BTC', value: prices.sbtc, change: -0.01 },
    ];

    // Duplicate for seamless loop
    const tickerItems = [...items, ...items, ...items];

    return (
        <div className="bg-orange-500 text-white overflow-hidden py-1.5">
            <div className="flex animate-ticker whitespace-nowrap">
                {tickerItems.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-2 px-8 text-xs font-semibold font-mono">
                        <span className="opacity-80">{item.label}:</span>
                        <span>{item.value}</span>
                        <span className={item.change >= 0 ? 'text-green-200' : 'text-red-200'}>
                            {item.change >= 0 ? '↑' : '↓'}{Math.abs(item.change)}%
                        </span>
                        <span className="opacity-40 mx-2">|</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
