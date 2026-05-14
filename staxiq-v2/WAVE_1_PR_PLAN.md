# Wave 1 — PR sequence

This is the exact sequence I'd ship if I were the lead engineer on Staxiq. Each PR is independently reviewable, independently revertable, and adds visible value. Total wave-1 work: ~3 focused weeks for a senior dev working solo, faster if you skip features.

## PR 0 — Repo hygiene

**Branch:** `chore/repo-cleanup`
**Effort:** half a day
**Files:** see [`REPO_CLEANUP.md`](./REPO_CLEANUP.md)

Ship first. It's tiny, has no dependencies, and unblocks everything else by making the repo look serious. The "Portolio" → "Portfolio" typo is in your headline feature list — fix it before anyone else sees it.

**Acceptance:**
- README typo fixed
- Migration scripts moved or deleted
- v0.1.0 tag and release exist
- Real screenshot replaces placeholder banner
- `.env.example`, `SECURITY.md`, basic CI in place

---

## PR 1 — Adapter spine

**Branch:** `feat/adapter-architecture`
**Effort:** 2–3 days
**Files:**
- `server/integrations/types.js`
- `server/integrations/cache.js`
- `server/integrations/registry.js`
- `server/integrations/adapters/zest.js`
- `server/integrations/adapters/poxStacking.js`
- `server/integrations/crossval.js`
- `docs/METHODOLOGY.md`

Replaces all ad-hoc protocol fetching with the adapter contract. Every existing API route gets refactored to call `getAllAdapters()` / `fanOut()` instead of hand-rolled fetches.

**Acceptance:**
- `GET /api/yields` returns `{ ok: YieldQuote[], errors: [] }` with both Zest and PoX represented
- `GET /api/health` returns cross-validation report against DefiLlama for Zest
- Killing the Zest API mid-request causes the response to come back with `errors[0].protocolSlug === 'zest'` but `ok` still contains PoX yields
- All adapter calls go through `cache.wrap` — verifiable by hitting the same endpoint twice and seeing one network call, not two
- `docs/methodology` is reachable from the footer

**Tests to write:**
- `cache.wrap` de-duplicates concurrent calls
- `fanOut` doesn't fail entirely if one adapter throws
- `runCrossValidation` correctly classifies confidence at the warn/fail thresholds

---

## PR 2 — Transparent Wallet Health Score

**Branch:** `feat/transparent-health-score`
**Effort:** 1–2 days
**Files:**
- `server/healthScore/rubric.js`
- `server/healthScore/score.js`
- `src/components/HealthScoreCard.jsx`
- `docs/HEALTH_SCORE.md`

Removes the "proprietary algorithm" framing. The new card shows the score, the top 1–3 critical highlights, and the full rubric breakdown with deltas. Methodology link in the footer.

**Acceptance:**
- HealthScoreCard renders the rubric breakdown with one row per rule
- Each row shows the rule title, evidence message, and signed delta
- Score color and highlight severity match the rubric thresholds
- `docs/health-score` is reachable from a "Read the methodology →" link inside the card
- Rubric version is shown next to the score

**Tests:**
- A wallet with 90% in one protocol gets the -20 concentration penalty
- A wallet with HF 1.1 gets the -25 liquidation penalty
- An empty wallet returns 100 with no negative deltas

---

## PR 3 — Read-only research mode

**Branch:** `feat/research-mode`
**Effort:** 1 day
**Files:**
- `server/routes/readonly.js`
- `src/pages/ResearchMode.jsx`
- Add the route to the React router

The top-of-funnel feature. Anyone can paste a Stacks address and see the full dashboard view without connecting a wallet.

**Acceptance:**
- `/research` page accessible without wallet connection
- `/api/research/:address` returns positions + health for a valid Stacks address
- Invalid address returns 400 with a clean error
- Address validation regex matches both `SP...` and `ST...` formats
- Page renders the same `HealthScoreCard` and position list as the connected dashboard

**SEO:**
- Set `<title>` to "Inspect any Stacks portfolio · Staxiq"
- Set `<meta name="description">` to the H1 subtitle
- Add OpenGraph image (use the same banner.png)

---

## PR 4 — Grounded AI Copilot

**Branch:** `feat/grounded-copilot`
**Effort:** 2 days
**Files:**
- `server/ai/prompt.js`
- `server/ai/copilot.js`
- `server/ai/insights/idleCapital.js`
- API route to expose `runCopilot`
- UI component for rendering recommendations + refusals

Replaces any free-form chat box with a structured, grounded recommendation system. The model only ever sees structured input; outputs are JSON; ungrounded recommendations are dropped before they reach the UI.

**Acceptance:**
- Copilot endpoint accepts `{ userQuestion, address }` and returns the validated `CopilotResult` shape
- A wallet with idle sBTC produces an `insight:idle:SBTC` fact, and the model can reference it in `groundedIn`
- Recommendations missing a `groundedIn` array, or grounded in unknown ids, are filtered out
- Asking "will BTC go up?" produces an entry in `refusals` (no price predictions)
- The UI renders each recommendation with its rationale, action shape, and risk notes — no markdown, no free prose

**Tests:**
- `validateAndFilter` rejects recommendations whose groundedIn ids aren't in facts
- `validateAndFilter` rejects malformed JSON gracefully
- Idle capital detector triggers at $50 threshold but not at $40

---

## PR 5 — Updated positioning

**Branch:** `feat/positioning`
**Effort:** half a day
**Files:**
- `README.md`
- Homepage hero copy in your existing landing components
- GitHub repo description and topics
- Twitter bio (manual)

Adopts "Bitflow finds the best swap. Staxiq finds the best place to park your Bitcoin." across every surface. Removes any framing that puts Staxiq head-to-head with Bitflow.

**Acceptance:**
- README updated to the new positioning
- GitHub repo description updated
- GitHub topics include `bitcoin`, `stacks`, `defi`, `sbtc`, `yield-aggregator`, `portfolio`
- Live site hero copy updated
- "AI-powered" is de-emphasised — it's a feature, not the headline. The headline is "every Stacks DeFi position in one place"

---

## After Wave 1

Open Wave 2 PRs in parallel, each adding one adapter:
- Granite ($26M TVL — highest priority after Zest)
- StackingDAO ($20M TVL, plus the natural pairing with native PoX)
- Bitflow (DEX/AMM — yield from LPing)
- Alex
- Hermetica (USDh stablecoin yield)
- Velar

Each adapter is one PR, ~half a day each once the spine is in place. The adapter contract makes them mostly mechanical.

After all adapters land, ship the public protocol pages (`/protocols/:slug`) and start the [ecosystem playbook](./ECOSYSTEM_PLAYBOOK.md) outreach.
