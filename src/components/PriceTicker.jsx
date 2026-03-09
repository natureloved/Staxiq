import { useState, useEffect, useRef } from 'react';

// Hardcoded fallbacks if everything else fails
const DEFAULT_PRICES = {
    btc: { usd: '94,500', change: 1.25 },
    stx: { usd: '2.850', change: -0.52 },
    sbtc: 1.0001
};

export default function PriceTicker() {
    const [prices, setPrices] = useState({
        btc: { usd: '--', change: 0 },
        stx: { usd: '--', change: 0 },
        sbtc: 1.0001,
    });

    const lastFetchRef = useRef(0);

    useEffect(() => {
        async function fetchPrices() {
            const now = Date.now();
            // Don't fetch more than once every 5 minutes (300,000ms) to avoid 429s in Dev/Production
            if (now - lastFetchRef.current < 300000) return;

            // 1. Try Loading from Cache First to avoid flicker
            let currentPrices = { ...prices };
            try {
                const cached = localStorage.getItem('staxiq_prices');
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    // If cache is less than 1 hour old, use it as baseline
                    if (now - timestamp < 3600000) {
                        currentPrices = data;
                        setPrices(data);
                    }
                }
            } catch (e) { /* ignore cache errors */ }

            let success = false;

            // 2. Try CoinGecko (Source A)
            try {
                const res = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,blockstack&vs_currencies=usd&include_24hr_change=true'
                );
                if (res.ok) {
                    const data = await res.json();
                    const newPrices = {
                        btc: {
                            usd: data.bitcoin?.usd?.toLocaleString() || DEFAULT_PRICES.btc.usd,
                            change: data.bitcoin?.usd_24h_change?.toFixed(2) || DEFAULT_PRICES.btc.change,
                        },
                        stx: {
                            usd: data.blockstack?.usd?.toFixed(3) || DEFAULT_PRICES.stx.usd,
                            change: data.blockstack?.usd_24h_change?.toFixed(2) || DEFAULT_PRICES.stx.change,
                        },
                        sbtc: 1.0001,
                    };
                    setPrices(newPrices);
                    localStorage.setItem('staxiq_prices', JSON.stringify({ data: newPrices, timestamp: now }));
                    success = true;
                    lastFetchRef.current = now;
                }
            } catch (err) {
                console.log('CoinGecko fallback triggered (CORS/429)');
            }

            // 3. Try CryptoCompare (Source B - much better CORS support)
            if (!success) {
                try {
                    const res = await fetch('https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,STX&tsyms=USD');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.RAW) {
                            const raw = data.RAW;
                            const newPrices = {
                                btc: {
                                    usd: raw.BTC.USD.PRICE.toLocaleString(),
                                    change: raw.BTC.USD.CHANGEPCT24HOUR.toFixed(2),
                                },
                                stx: {
                                    usd: raw.STX.USD.PRICE.toFixed(3),
                                    change: raw.STX.USD.CHANGEPCT24HOUR.toFixed(2),
                                },
                                sbtc: 1.0001,
                            };
                            setPrices(newPrices);
                            localStorage.setItem('staxiq_prices', JSON.stringify({ data: newPrices, timestamp: now }));
                            success = true;
                            lastFetchRef.current = now;
                        }
                    }
                } catch (err) {
                    console.log('CryptoCompare fetch failed');
                }
            }

            // 4. Final Fallback to defaults if No UI data yet and no cache
            if (!success && prices.btc.usd === '--') {
                setPrices(DEFAULT_PRICES);
            }
        }

        fetchPrices();
        const interval = setInterval(fetchPrices, 600000); // Check every 10 mins
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
