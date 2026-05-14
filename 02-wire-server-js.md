# Wiring `server.js`

Your existing `server.js` proxies blockchain data via Express. This guide adds three things to it without breaking what's already there:

1. An `AdapterContext` — the single object every adapter receives
2. The read-only routes (`/api/yields`, `/api/protocols`, `/api/research/:address`, `/api/health`)
3. Optional: the AI Copilot endpoint

Each step is independent. You can ship #1 and #2 today and add #3 later.

---

## Step 1 — Add the AdapterContext

At the **top of `server.js`** (after your other imports), add:

```js
import { createMemoryCache } from './server/integrations/cache.js';

// Single shared context for every adapter call. In production with multiple
// instances, swap createMemoryCache() for a Redis-backed implementation
// behind the same Cache interface.
const adapterCtx = {
  network: process.env.STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  fetch: (url, init) => fetch(url, init),         // Node 18+ has global fetch
  cache: createMemoryCache(),
  log: (msg, meta) => console.log('[adapter]', msg, meta ?? ''),
};
```

Place this **before** any `app.get(...)` calls so the context exists when routes are mounted.

### Why this shape

The context is intentionally minimal and injected — no adapter ever reaches for `process.env`, `console`, or a global cache directly. This is what makes the system testable: in unit tests, you pass a fake `fetch` and a memory cache, and adapters work the same way.

---

## Step 2 — Mount the read-only routes

Anywhere after `const app = express();` and after the `adapterCtx` is created, add:

```js
import { mountReadOnlyRoutes } from './server/routes/readonly.js';

mountReadOnlyRoutes(app, adapterCtx);
```

That's it. This single call wires up:

| Route | Purpose |
|---|---|
| `GET /api/protocols` | Index of every integrated protocol with its meta |
| `GET /api/protocols/:slug` | Per-protocol page data — meta, current yields, live TVL |
| `GET /api/yields` | Aggregated yields across all protocols, with partial-failure shape |
| `GET /api/research/:address` | Read-only portfolio for any Stacks address |
| `GET /api/health` | Cross-validation report against DefiLlama for every protocol |

### Verify it's working

After restarting the server:

```bash
curl http://localhost:3005/api/protocols | jq
# Expect: { "protocols": [ { "slug": "zest", ... }, { "slug": "pox-stacking", ... } ] }

curl http://localhost:3005/api/yields | jq '.ok | length'
# Expect: a positive number (number of yield offerings across all protocols)

curl http://localhost:3005/api/health | jq '.reports[].confidence'
# Expect: a list of "ok", "warn", "fail", or "unknown" — one per protocol
```

If you get a 404 on these routes, check that `mountReadOnlyRoutes(app, adapterCtx)` is mounted **before** any catch-all 404 handler or `app.use(express.static(...))` for the SPA fallback.

### Common ordering mistake

If your existing `server.js` looks like this:

```js
app.use(express.static('dist'));            // ⚠️  catches everything
app.get('*', (req, res) => res.sendFile(...));

mountReadOnlyRoutes(app, adapterCtx);       // 🛑  too late, never reached
```

…the new API routes will never be hit because the static handler catches `/api/*` first. Move the `mountReadOnlyRoutes` call **above** the static + catch-all:

```js
mountReadOnlyRoutes(app, adapterCtx);       // ✅  API routes first

app.use(express.static('dist'));
app.get('*', (req, res) => res.sendFile(...));
```

---

## Step 3 — (Optional) AI Copilot endpoint

Skip this if you haven't picked an LLM provider yet. When you're ready:

```js
import { runCopilot } from './server/ai/copilot.js';
import { computeHealthScore } from './server/healthScore/score.js';
import { fanOut } from './server/integrations/registry.js';

// Inject your model client. This example uses the Anthropic SDK; swap for
// OpenAI, Google, or self-hosted as you prefer.
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callModel(messages) {
  const sys = messages.find((m) => m.role === 'system')?.content ?? '';
  const userMessages = messages.filter((m) => m.role !== 'system');
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: sys,
    messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
  });
  // Pull the text out of the first content block. The Copilot expects a
  // raw JSON string back; the strict prompt forbids prose, so this is safe.
  return res.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim();
}

app.post('/api/copilot', express.json(), async (req, res) => {
  const { address, userQuestion } = req.body ?? {};
  if (!address || !userQuestion) {
    return res.status(400).json({ error: 'address and userQuestion required' });
  }

  // Build the snapshot the Copilot needs. (Reuse your existing portfolio
  // assembly here once it's in place; for now the read-only route already
  // gathers positions — call it inline.)
  const positions = await fanOut((a) => a.fetchUserPositions(adapterCtx, address));
  const snap = {
    address,
    totalUsd: '0',
    balances: [],
    positions: positions.ok,
  };
  const health = computeHealthScore(snap);

  const result = await runCopilot({ userQuestion, snap, health, callModel });
  res.json(result);
});
```

### Why we wrap the model call

The Copilot orchestration (`server/ai/copilot.js`) accepts a `callModel` function rather than reaching for an API client directly. This means:

- **Testable** — pass a stub that returns a canned JSON string in unit tests
- **Provider-agnostic** — swap Anthropic for OpenAI for a self-hosted model without touching the orchestration logic
- **Observable** — wrap `callModel` to log every prompt and response if you want a trace

The strict system prompt + post-validation in `validateAndFilter` means the Copilot is safe regardless of which model you use, as long as the model returns parseable JSON.

---

## Step 4 — Frontend route

In your React router (wherever your routes are declared), add:

```jsx
import ResearchMode from './pages/ResearchMode.jsx';

// React Router v6 syntax:
<Route path="/research" element={<ResearchMode />} />
```

Then test by visiting `http://localhost:3005/research` and pasting any Stacks address. You should see live position data come back, the health score render, and the rubric breakdown beneath it.

---

## Smoke test checklist

After all four steps:

- [ ] `GET /api/protocols` returns at least Zest, PoX, and Granite
- [ ] `GET /api/yields` returns yields with non-zero APYs (placeholder values are okay; real values come once you fill in the API base URLs)
- [ ] `GET /api/research/SP...` returns positions or an empty array (not a 500)
- [ ] `GET /api/research/garbage` returns 400 with `{ error: 'invalid stacks address' }`
- [ ] `GET /api/health` returns a cross-validation report
- [ ] `/research` page renders the input field, accepts a paste, and shows the dashboard
- [ ] If any single adapter throws, the response still comes back with `errors[].protocolSlug` populated and `ok` containing the working adapters' data

If any of these fail, the issue is almost certainly route ordering (see the "Common ordering mistake" note in Step 2) or a missing env var (`ZEST_API_BASE`, `GRANITE_API_BASE`, `STACKS_NETWORK`).
