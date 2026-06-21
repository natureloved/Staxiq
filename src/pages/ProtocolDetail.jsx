import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const RISK_COLORS = {
  low: { color: '#22c55e', bg: '#22c55e18', border: '#22c55e44' },
  medium: { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b44' },
  high: { color: '#ef4444', bg: '#ef444418', border: '#ef444444' },
};

export default function ProtocolDetail() {
  const { slug } = useParams();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const s = (val) => ({
    bg: isDark ? '#0d1117' : '#ffffff',
    card: isDark ? '#141c2e' : '#f8faff',
    border: isDark ? '#1e2d4a' : '#dde5f5',
    text: isDark ? '#f0f4ff' : '#0a0e1a',
    muted: isDark ? '#8899bb' : '#334155',
    dim: isDark ? '#4a5a7a' : '#8899bb',
  })[val];

  React.useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/protocols/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Protocol not found (${r.status})`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded-xl" style={{ background: isDark ? '#1e2d4a' : '#e2e8f0' }} />
          <div className="h-48 rounded-2xl" style={{ background: isDark ? '#1e2d4a' : '#e2e8f0' }} />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 rounded-2xl" style={{ background: isDark ? '#1e2d4a' : '#e2e8f0' }} />
            <div className="h-32 rounded-2xl" style={{ background: isDark ? '#1e2d4a' : '#e2e8f0' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: s('text') }}>Protocol Not Found</h2>
        <p className="text-sm mb-6" style={{ color: s('muted') }}>{error}</p>
        <Link
          to="/compare"
          className="px-6 py-2 rounded-xl font-bold text-white text-sm"
          style={{ background: '#F7931A' }}
        >
          ← Back to Compare
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { meta, tvl, yields } = data;
  const riskStyle = RISK_COLORS[meta.risk?.smartContract] || RISK_COLORS.medium;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/compare"
        className="text-xs font-semibold underline"
        style={{ color: '#3B82F6' }}
      >
        ← All Protocols
      </Link>

      {/* Header */}
      <div
        className="rounded-2xl p-6 flex items-start gap-5"
        style={{ background: s('card'), border: `1px solid ${s('border')}` }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
          style={{
            background: `${meta.color || '#F7931A'}22`,
            color: meta.color || '#F7931A',
            border: `2px solid ${meta.color || '#F7931A'}55`,
          }}
        >
          {meta.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1
            className="font-display font-black text-3xl mb-1"
            style={{ color: s('text') }}
          >
            {meta.name}
          </h1>
          <p className="text-sm mb-3" style={{ color: s('muted') }}>
            {meta.category} ·{' '}
            <a
              href={meta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: '#3B82F6' }}
            >
              Open App ↗
            </a>
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: riskStyle.bg,
                color: riskStyle.color,
                border: `1px solid ${riskStyle.border}`,
              }}
            >
              {meta.risk?.smartContract || 'medium'} risk
            </span>
            {meta.kinds?.map((k) => (
              <span
                key={k}
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: isDark ? '#1e2d4a' : '#f1f5ff',
                  color: s('muted'),
                  border: `1px solid ${s('border')}`,
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
        {tvl && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: s('dim') }}>
              TVL
            </p>
            <p className="font-mono font-black text-2xl" style={{ color: '#3B82F6' }}>
              ${Number(tvl.tvlUsd).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Risk note */}
      {meta.risk?.notes && (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            background: `${riskStyle.bg}`,
            border: `1px solid ${riskStyle.border}`,
            color: s('text'),
          }}
        >
          <span className="font-bold">Risk note:</span> {meta.risk.notes}
        </div>
      )}

      {/* Yield offerings */}
      <div>
        <h2 className="font-bold text-lg mb-3" style={{ color: s('text') }}>
          Yield Offerings
        </h2>
        {yields && yields.length > 0 ? (
          <div className="space-y-3">
            {yields.map((yieldItem) => (
              <div
                key={yieldItem.id}
                className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4"
                style={{ background: s('card'), border: `1px solid ${s('border')}` }}
              >
                <div>
                  <p className="font-bold text-sm" style={{ color: s('text') }}>
                    {yieldItem.label}
                  </p>
                  <p className="text-xs" style={{ color: s('muted') }}>
                    {yieldItem.kind} · {yieldItem.asset}
                  </p>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  {yieldItem.apyBase && (
                    <div className="text-right">
                      <p className="text-xs" style={{ color: s('dim') }}>Base APY</p>
                      <p className="font-mono font-bold text-sm" style={{ color: s('text') }}>
                        {(Number(yieldItem.apyBase) * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                  {yieldItem.apyReward && Number(yieldItem.apyReward) > 0 && (
                    <div className="text-right">
                      <p className="text-xs" style={{ color: s('dim') }}>Rewards</p>
                      <p className="font-mono font-bold text-sm" style={{ color: '#8b5cf6' }}>
                        +{(Number(yieldItem.apyReward) * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-xs" style={{ color: s('dim') }}>Total APY</p>
                    <p className="font-mono font-black text-lg" style={{ color: '#F7931A' }}>
                      {(Number(yieldItem.apyTotal) * 100).toFixed(2)}%
                    </p>
                  </div>
                  {meta.url && (
                    <a
                      href={meta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                      style={{ background: meta.color || '#F7931A' }}
                    >
                      Use Protocol ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-8 text-center text-sm"
            style={{ background: s('card'), border: `1px solid ${s('border')}`, color: s('muted') }}
          >
            No yield data available right now. Check back soon.
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-3">
        {meta.docsUrl && (
          <a
            href={meta.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: s('card'), color: s('text'), border: `1px solid ${s('border')}` }}
          >
            📖 Docs
          </a>
        )}
        {meta.auditUrl && (
          <a
            href={meta.auditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: s('card'), color: s('text'), border: `1px solid ${s('border')}` }}
          >
            🔒 Audit
          </a>
        )}
      </div>
    </div>
  );
}
