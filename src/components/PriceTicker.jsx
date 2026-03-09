import { useState, useEffect, useRef } from 'react';

// Fallback values in case of 429/CORS
const FALLBACK_PRICES = {
    bitcoin: { usd: 94500, usd_24h_change: 1.25 },
    blockstack: { usd: 2.85, usd_24h_change: -0.52 }
};

export default function PriceTicker() {
    const [prices, setPrices] = useState({
        btc: { usd: '--', change: 0 },
        stx: { usd: '--', change: 0 },
        sbtc: 1.0001,
    });

    // Prevent rapid fire fetches (especially during HMR)
    const lastFetchRef = useRef(0);

    useEffect(() => {
        async function fetchPrices() {
            const now = Date.now();
            if (now - lastFetchRef.current < 30000) return; // Wait at least 30s

            try {
                const res = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,blockstack&vs_currencies=usd&include_24hr_change=true',
                    { mode: 'cors' }
                );

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();
                lastFetchRef.current = Date.now();

                setPrices({
                    btc: {
                        usd: data.bitcoin?.usd?.toLocaleString() || FALLBACK_PRICES.bitcoin.usd.toLocaleString(),
                        change: data.bitcoin?.usd_24h_change?.toFixed(2) || FALLBACK_PRICES.bitcoin.usd_24h_change,
                    },
                    stx: {
                        usd: data.blockstack?.usd?.toFixed(3) || FALLBACK_PRICES.blockstack.usd.toFixed(3),
                        change: data.blockstack?.usd_24h_change?.toFixed(2) || FALLBACK_PRICES.blockstack.usd_24h_change,
                    },
                    sbtc: 1.0001,
                });
            } catch (err) {
                console.warn('Price fetch failed (using fallback):', err.message);
                // Set fallback data so UI isn't empty
                setPrices(prev => ({
                    ...prev,
                    btc: {
                        usd: FALLBACK_PRICES.bitcoin.usd.toLocaleString(),
                        change: FALLBACK_PRICES.bitcoin.usd_24h_change,
                    },
                    stx: {
                        usd: FALLBACK_PRICES.blockstack.usd.toFixed(3),
                        change: FALLBACK_PRICES.blockstack.usd_24h_change,
                    }
                }));
            }
        }

        fetchPrices();
        const interval = setInterval(fetchPrices, 60_000);
        return () => clearInterval(interval);
    }, []);

    const items = [
        { label: 'BTC/USD', value: `$${prices.btc.usd}`, change: prices.btc.change },
        { label: 'STX/USD', value: `$${prices.stx.usd}`, change: prices.stx.change },
        { label: 'sBTC/BTC', value: prices.sbtc, change: -0.01 },
    ];

    const tickerItems = [...items, ...items, ...items];

    return (
        <div className="bg-orange-500 text-white overflow-hidden py-1.5 shadow-sm">
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
