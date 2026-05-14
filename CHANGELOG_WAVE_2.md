# Wave 2 — Granite increment

This is a small, focused increment on top of Wave 1: the Granite adapter goes live.

## What's in this increment

| File | Purpose |
|---|---|
| `server/integrations/adapters/granite.js` | Full Granite adapter — supply (LP) and borrow (vault) sides |
| `docs/patches/01-register-granite.md` | Two-line registry update + env var |
| `docs/patches/02-wire-server-js.md` | The `server.js` integration patch you asked for |

## Why Granite next (not StackingDAO or Bitflow)

Three reasons, in priority order:

1. **TVL leverage.** At ~$26M TVL, Granite is the second-largest source of yield on Stacks after Zest. Adding it raises the share of the Stacks DeFi ecosystem Staxiq covers from "the big one" to "the two big ones" — enough to credibly call yourself a comprehensive aggregator.
2. **Risk diversity.** Granite's isolated-collateral, partial-liquidation design is structurally different from Zest's pooled model. Your users and the rubric both benefit from being able to surface that distinction — same asset (sBTC), very different risk profile.
3. **Same shape as Zest.** It's a lending market with supply and borrow APYs, so the Zest adapter pattern transfers directly. Lowest implementation risk for the highest TVL gain.

After Granite lands, the next two adapters in priority order are:

- **StackingDAO** ($20M TVL) — liquid stacking. Different shape (single asset, single yield); pairs naturally with the native PoX adapter for a "solo vs pooled" comparison view.
- **Bitflow** — DEX/AMM. The yield comes from LP fees, not interest, so the adapter shape is closer to a Uniswap-style AMM than a lending market. New territory.

## Integration sequence

Do these in order. Each is reversible.

### 1. Drop the adapter in

Move `granite.js` into `server/integrations/adapters/` next to `zest.js` and `poxStacking.js`.

### 2. Register it

Follow `docs/patches/01-register-granite.md` — it's a two-line edit to `server/integrations/registry.js` and one env var.

### 3. Wire `server.js` (if not already done from Wave 1)

Follow `docs/patches/02-wire-server-js.md`. This is the patch you asked for in the previous turn — it adds the `AdapterContext`, mounts the read-only routes, and (optionally) wires the AI Copilot.

The patch is structured as four independent steps so you can ship Step 1 + Step 2 today and add Step 3 (Copilot) when you've picked an LLM provider.

### 4. Verify

```bash
# Restart server, then:
curl http://localhost:3005/api/protocols | jq '.protocols | map(.slug)'
# Expect: ["zest", "pox-stacking", "granite"]

curl http://localhost:3005/api/yields | jq '.ok | group_by(.protocolSlug) | map({slug: .[0].protocolSlug, count: length})'
# Expect: a row for granite with count >= 1

curl http://localhost:3005/api/health | jq '.reports[] | select(.protocolSlug == "granite")'
# Expect: confidence "ok" / "warn" / "fail" — confirms DefiLlama cross-check works
```

## Updates needed elsewhere

After this increment lands, two small updates to keep the docs in sync with reality:

### `docs/METHODOLOGY.md`

In the "Data sources" table, change the Granite row from `_coming in wave 2_` to:

```
| Granite | Granite public API | DefiLlama (`granite`) | Isolated-collateral; partial liquidations only |
```

### `README.md`

In the Roadmap section, move "Granite" from Wave 2 to the completed list.

## Caveats (same as Wave 1)

The `GRANITE_API_BASE` and the exact response shape (`/v1/markets`, `/v1/users/:address/positions`) are placeholders based on common patterns. Confirm them against https://docs.granite.world before flipping the registry entry on. The adapter handles 404s gracefully (returns empty for users with no position) and uses `Promise.allSettled` semantics upstream, so wrong-URL failures will be captured and surfaced as a `degraded source` in the UI rather than crashing the response.

If Granite's actual response shape diverges from what's in the adapter, the only places that need updating are the field accesses in `fetchYields()` and `fetchUserPositions()` — everything else (caching, types, registry, cross-validation) is unchanged.
