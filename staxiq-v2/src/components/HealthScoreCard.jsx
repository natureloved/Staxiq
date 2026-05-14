/**
 * HealthScoreCard
 *
 * Replaces the opaque "Wallet Health Score" with a fully-transparent
 * breakdown. Every line shows: the rule title, the delta it applied, and
 * the human-readable evidence backing it.
 *
 * Visual logic: the score is rendered as a single big tabular number with
 * the rubric rules listed below — like a tax return, not a credit score.
 * That's intentional: in finance, opacity == suspicion, transparency ==
 * trust.
 */
export function HealthScoreCard({ health }) {
  if (!health) return null;
  const { score, breakdown, highlights, rubricVersion } = health;

  return (
    <section className="border border-zinc-900">
      <header className="flex items-baseline justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950">
        <h2 className="text-xs tracking-[0.3em] text-zinc-500 uppercase">
          Wallet health score
        </h2>
        <span className="text-xs text-zinc-600 tabular-nums">
          rubric v{rubricVersion}
        </span>
      </header>

      <div className="px-4 py-6 grid grid-cols-1 md:grid-cols-[auto,1fr] gap-8 items-center border-b border-zinc-900">
        <div className="flex items-baseline gap-2">
          <span className={`text-7xl font-semibold tabular-nums ${scoreColor(score)}`}>
            {score}
          </span>
          <span className="text-zinc-600 text-2xl">/100</span>
        </div>

        {highlights.length > 0 ? (
          <ul className="space-y-2">
            {highlights.slice(0, 3).map((h, i) => (
              <li
                key={i}
                className={`text-sm flex gap-3 ${
                  h.severity === 'crit' ? 'text-red-300' : 'text-amber-300'
                }`}
              >
                <span aria-hidden>{h.severity === 'crit' ? '!' : '·'}</span>
                <span>{h.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-400 text-sm">
            No critical issues detected. Detailed rubric below.
          </p>
        )}
      </div>

      <div>
        <header className="px-4 py-2 text-xs tracking-[0.3em] text-zinc-500 uppercase border-b border-zinc-900">
          Rubric breakdown
        </header>
        <ul>
          {breakdown.map((r) => (
            <li
              key={r.ruleId}
              className="grid grid-cols-[1fr,auto] gap-4 px-4 py-3 border-b border-zinc-900 last:border-b-0 hover:bg-zinc-950/60"
            >
              <div>
                <p className="text-zinc-200">{r.title}</p>
                <p className="text-zinc-500 text-sm mt-0.5">{r.evidence.message}</p>
              </div>
              <div
                className={`tabular-nums text-sm ${deltaColor(r.delta)}`}
                title={`Max possible: ±${r.maxAbsDelta}`}
              >
                {r.delta > 0 ? '+' : ''}
                {r.delta}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <footer className="px-4 py-3 text-xs text-zinc-600 border-t border-zinc-900">
        Every rule is open-source.{' '}
        <a
          href="/docs/health-score"
          className="underline decoration-dotted underline-offset-4 hover:text-zinc-400"
        >
          Read the methodology →
        </a>
      </footer>
    </section>
  );
}

function scoreColor(s) {
  if (s >= 80) return 'text-emerald-400';
  if (s >= 60) return 'text-amber-300';
  return 'text-red-400';
}

function deltaColor(d) {
  if (d > 0) return 'text-emerald-400';
  if (d < 0) return 'text-red-400';
  return 'text-zinc-500';
}
