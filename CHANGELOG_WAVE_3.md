# Wave 3 — Portfolio enricher

This increment fills in the missing data layer underneath the health score and the AI Copilot. Until this lands, every priced-USD calculation in the system is operating on stub data: `totalUsd: '0'`, `balances: []`. After it lands, the rubric and the idle-capital insight detector both work end-to-end.

## What's in this increment

| File | Purpose |
|---|---|
| `server/portfolio/tokens.js` | SIP-010 token registry (sBTC, stablecoins, stSTX, etc.) |
| `server/portfolio/prices.js` | Price oracle — CoinGecko + stablecoin pinning + sBTC↔BTC |
| `server/portfolio/balances.js` | Hiro Stacks API balance fetcher with BigInt-safe scaling |
| `server/portfolio/snapshot.js` | Orchestrator — assembles balances + prices + positions |
| `docs/patches/03-portfolio-enricher.md` | Route handler patch (replaces the stub snapshot) |
| `docs/patches/04-fix-asset-diversity-rule.md` | **Bug fix** — rubric correctness issue caught by tests; bumps rubric to 0.1.1 |

## Bug found and fixed during integration

End-to-end testing surfaced a real correctness issue in the wave-1 `asset-diversity` rule: it only inspected wallet balances, ignoring positions. So a user with all of their sBTC supplied to Zest was not credited with "holds BTC" — clearly wrong, since the rule is meant to detect single-asset concentration risk regardless of where the asset sits.

Patch 04 fixes it (one-line change to the rule body), bumps the rubric version from 0.1.0 to 0.1.1, and updates the methodology doc. The fix is conservative — it only adds positive points, never penalises — so existing scores can only stay the same or go up. Verified with end-to-end tests on two portfolio scenarios.

## Why this was the right next move

The health score has five rules. **Three of them — concentration, idle-capital, and asset-diversity — depend on USD values that didn't exist** until now. The rubric was running, but always returning the default `100` regardless of portfolio shape. Every grant reviewer or institutional user who tested the research-mode page would have seen a fake-looking perfect score.

This is also the unblocker for the AI Copilot. The idle-capital insight detector is wired up but had no input — `balances: []` meant nothing to detect. Now any address with idle sBTC, STX, or stablecoins above $50 will trigger a fact the Copilot can ground recommendations in.

## Architecture notes

A few decisions worth being explicit about:

**The token registry is hand-curated, not auto-discovered.** Stacks has a SIP-016 metadata standard but it's inconsistently implemented and chain-resolved metadata is occasionally wrong or missing. A token aggregator's reputation depends on showing the right symbol next to the right number — hand-curating a few dozen tier-1 tokens is the right tradeoff vs. cutting corners. Unknown tokens are logged so the registry grows organically based on what real users hold.

**Stablecoins are pinned to $1.00.** This is the standard simplification, but it's also a known limitation: USDC has depegged before (March 2023), and the depeg isn't visible if we don't actively check. A future improvement would consult Pyth feeds (Granite already integrates Pyth on Stacks) to detect depegs and surface them. Until then, the methodology doc is honest about the limitation.

**sBTC is priced as 1:1 with BTC by construction.** Same reasoning as stablecoins — sBTC is fully Bitcoin-backed by design, and a depeg would be a major incident worth surfacing explicitly rather than absorbing into a generic price feed. If sBTC ever shows a measurable spread vs BTC, that's a signal users need to see, not a number to silently average.

**BigInt-safe scaling.** The `scaleDown` function in `balances.js` uses string math (not floats) to convert raw integer balances to decimal strings. A 1.0 sBTC balance is `100000000` in raw form (8 decimals); naively dividing by 1e8 in JavaScript loses precision on larger balances. The string-math version is exact at any scale.

**Degradation is layered.** If Hiro is down, balances are empty but positions still work. If CoinGecko is down, prices are missing for some symbols but stablecoins still pin to $1 and the response still goes out with whatever it has. The route never 5xxs because of a transient external failure; it returns partial data and logs the degradation.

## Integration sequence

1. **Drop the four `server/portfolio/*.js` files** into your repo (the directory matches the wave-1 tree).
2. **Apply the route patch** in `docs/patches/03-portfolio-enricher.md` — two new lines of import + replace the stub snapshot with `buildSnapshot(...)`.
3. **(Optional) Apply the UI tweak** in Step 3 of the same patch to surface `totalUsd` on the research-mode page header.
4. **Verify with a real address** using the curl in Step 4 of the patch.

## Verify the idle-capital insight now fires

Once the patch is applied, this should work end-to-end:

```bash
# Use an address with idle sBTC, STX, or stablecoins (e.g. a yours that hasn't
# deployed everything to a protocol).
ADDR="SP..."

curl "http://localhost:3002/api/research/$ADDR" | jq '{
  totalUsd,
  idleCheck: .health.breakdown[] | select(.ruleId == "idle-capital"),
  diversityCheck: .health.breakdown[] | select(.ruleId == "asset-diversity"),
  concentrationCheck: .health.breakdown[] | select(.ruleId == "concentration")
}'
```

If those three rules now have non-zero `delta` values for portfolios where they should fire, the data layer is fully wired. The Copilot endpoint (when you turn it on per the wave-1 patch step 3) will also start grounding recommendations in actual portfolio facts.

## Caveats to fix before mainnet

1. **Verify the contract IDs in `tokens.js`** against each protocol's official docs. The values shipped are best-known publicly, but contract addresses can change with protocol upgrades. A wrong ID silently fails to resolve a balance — bad UX but not a security issue.
2. **Add USDh to the registry once you've confirmed the contract ID** at hermetica.fi. I left it commented out rather than ship a guess.
3. **Testnet token registry is not populated.** If you want testnet support for the research mode (useful for demos), add a `SIP010_REGISTRY_TESTNET` block in `tokens.js`.
4. **CoinGecko free-tier rate limits** are around 10–30 calls/min. With the 5-minute cache TTL and request coalescing, this is fine for normal traffic but won't survive a viral moment. For production scale, sign up for a CoinGecko Pro key or swap in a Pyth-based price oracle (the interface in `prices.js` is small enough that a Pyth implementation is a one-day swap).

## What unblocks next

With balances + USD values flowing:

- **The full health score works correctly** for the first time. Concentration, idle-capital, and asset-diversity all produce meaningful deltas.
- **The AI Copilot has facts to ground in.** Turn on the `/api/copilot` endpoint from wave-1 step 3 whenever you've picked an LLM provider.
- **The next adapter (StackingDAO) becomes the highest-leverage move**, since it's the third-largest TVL source and the natural pairing with the native PoX adapter you already have.

Or alternatively, this is a good moment to **ship a public release** (v0.2.0). What you have now is genuinely a working product: read-only research mode, live data from Zest + Granite + native PoX, transparent score, real USD calculations, public methodology. That's substantially more than most "DeFi aggregators on GitHub" that never make it past the README.
