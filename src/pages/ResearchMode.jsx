import { useState } from 'react';
import { HealthScoreCard } from '../components/HealthScoreCard.jsx';

/**
 * Research Mode: Top-of-funnel page. No wallet connection. Anyone can paste
 * a Stacks address and see the same view a connected user gets.
 *
 * Design intent: looks like a Bloomberg terminal field — single tall input,
 * monospace, mono-numerals. Bitcoin-orange accent reserved for the action,
 * not chrome. We resist the urge to render a glassmorphism marketing page;
 * the credibility move is to show data fast.
 */
export default function ResearchMode({ connected, address: connectedAddress }) {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup(e) {
    e.preventDefault();
    setError('');
    setData(null);
    if (!/^S[PMNT][0-9A-HJKMNP-Z]{26,39}$/.test(address.trim())) {
      setError('That doesn\'t look like a Stacks address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/research/${address.trim()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'lookup failed');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-zinc-100 font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="mb-12">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-2">
            Staxiq Research
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-50">
            Inspect any Stacks portfolio.
          </h1>
          <p className="mt-3 text-zinc-400 max-w-xl">
            Paste an address. Get every position across Zest, Granite,
            StackingDAO, Bitflow, native PoX stacking, and more. No wallet,
            no signup.
          </p>
        </header>

        <form onSubmit={handleLookup} className="flex flex-col md:flex-row gap-3 mb-10">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="SP2...ABC"
            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-[#f7931a] outline-none px-4 py-3 text-zinc-100 placeholder:text-zinc-600 transition-colors"
            spellCheck={false}
            autoCapitalize="characters"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#f7931a] hover:bg-[#ff9f2e] disabled:opacity-50 text-black font-semibold px-6 py-3 transition-colors"
          >
            {loading ? 'Looking up…' : 'Inspect'}
          </button>
        </form>

        {connected && connectedAddress && (
          <button
            onClick={() => setAddress(connectedAddress)}
            className="text-xs text-[#f7931a] hover:underline mb-8 -mt-6 block"
          >
            Inspect my own wallet ({connectedAddress.slice(0, 4)}...{connectedAddress.slice(-4)})
          </button>
        )}

        {error && (
          <div className="border border-red-900 bg-red-950/40 px-4 py-3 text-red-300 text-sm mb-8">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-10">
            <div className="border border-zinc-900 px-4 py-6">
              <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-1">
                Total portfolio
              </p>
              <p className="text-4xl font-semibold tabular-nums text-zinc-50">
                ${Number(data.totalUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                {data.balances.length} wallet asset{data.balances.length === 1 ? '' : 's'} ·{' '}
                {data.positions.length} active position{data.positions.length === 1 ? '' : 's'}
              </p>
            </div>

            <HealthScoreCard health={data.health} />

            <section>
              <h2 className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
                Positions ({data.positions.length})
              </h2>
              {data.positions.length === 0 ? (
                <p className="text-zinc-500 text-sm">
                  No positions detected across integrated protocols.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-900 border border-zinc-900">
                  {data.positions.map((p) => (
                    <li
                      key={p.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-2 px-4 py-3 hover:bg-zinc-900/40"
                    >
                      <div>
                        <span className="text-zinc-300">{p.protocolSlug}</span>
                        <span className="text-zinc-600 ml-2 text-xs uppercase tracking-wider">
                          {p.kind}
                        </span>
                      </div>
                      <div className="tabular-nums text-zinc-200">
                        {p.principal.amount} {p.principal.symbol}
                      </div>
                      <div className="tabular-nums text-zinc-500 text-sm md:text-right">
                        {Number(p.apyTotal) >= 0 ? '+' : ''}
                        {(Number(p.apyTotal) * 100).toFixed(2)}% APY
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {data.upcoming && data.upcoming.length > 0 && (
              <section className="border border-zinc-900 px-4 py-4 mt-6">
                <h2 className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-3">
                  Coming soon
                </h2>
                <ul className="text-sm text-zinc-400 space-y-1">
                  {data.upcoming.map((u) => (
                    <li key={u.protocolSlug}>
                      <span className="text-zinc-300 capitalize">{u.protocolSlug}</span> positions — {u.message}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.degraded && data.degraded.length > 0 && (
              <section>
                <h2 className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-3">
                  Degraded sources
                </h2>
                <ul className="text-sm text-zinc-500 space-y-1">
                  {data.degraded.map((d) => (
                    <li key={d.protocolSlug}>
                      <span className="text-zinc-400">{d.protocolSlug}</span>: {d.error}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
