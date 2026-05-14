# Ecosystem playbook

Feedback items #8 and #9 are mostly action items rather than code. This file is a concrete sequence — each item is something you can finish in an afternoon, ordered by leverage.

## Wave 1 — Ship before talking to anyone

These need to be live before you do outreach. Otherwise you're pitching a promise.

- [ ] **Ship the data adapters and read-only mode.** This is what makes Staxiq credible. Pitches go much better when "try it on any address" works.
- [ ] **Publish `/docs/methodology` and `/docs/health-score` as routes** on the live site (not just markdown in the repo). Link them from the footer. Grant reviewers, journalists, and institutional users will read these.
- [ ] **Publish a methodology blog post.** One canonical post titled something like *"How Staxiq calculates Stacks DeFi yields (and why we cross-validate against DefiLlama)"* — this ranks in Google for Stacks DeFi searches and demonstrates seriousness. Cross-post to Mirror.

## Wave 2 — Trust surface

- [ ] **Privacy policy + terms of service.** Use a template — Termly, iubenda, or hand-rolled is fine. Institutional users won't touch you without these. Linked from footer.
- [ ] **`/security` page.** Restate the non-custodial model, link to your audit posture (none yet — say so), explain what the Clarity contracts can and can't do. Honesty here builds more trust than pretending to a maturity you don't have.
- [ ] **Add a `SECURITY.md` to the repo** with vulnerability disclosure policy.
- [ ] **Public health endpoint.** Already designed (`/api/health`). Link to a small public status page from the footer: "Data confidence across protocols". This is the publicly-admit-when-we-drift surface — it's a moat not a vulnerability.

## Wave 3 — Stacks ecosystem moves

These are roughly in priority order. You can pursue several in parallel.

### Stacks Endowment Grant

- [ ] **Apply to the Stacks Endowment Grants Program.** Per the 2026 roadmap, they're explicitly funding builder tooling, with 23.4% of the 2026 budget allocated to working capital deploying into DeFi liquidity, and direct grants for BTC DeFi staking apps. Aggregators and dashboards fit cleanly into this.

  Application angle: *"Staxiq lowers the on-ramp friction for new sBTC DeFi users by surfacing the entire ecosystem in one transparent dashboard. The methodology is open, the cross-validation is public, and the read-only mode means anyone — institutional or retail — can evaluate Stacks DeFi without a wallet."*

  Apply at: https://stacks.org/grants

### Ecosystem listing

- [ ] **Get listed on `stacks.co/explore/ecosystem`.** This is a manual submission. Aim to be listed in the "DeFi" or "Tools" section. Submission flow: contact the Stacks Foundation via their site or Discord, provide a one-paragraph description, logo, and live URL.

### Wallet partnerships

- [ ] **Leather Wallet integration discussion.** Leather has 370k+ users (per the Bitflow press release). The natural integration is a "Portfolio" tab inside Leather that pulls from Staxiq's API. Reach out to Leather BD via their Discord or [hello@leather.io](mailto:hello@leather.io) — the pitch is "free, useful tab, increases time-in-app for your users."

- [ ] **Xverse integration discussion.** Same pitch, parallel outreach. Xverse skews more retail; emphasise the read-only research mode as a low-friction "explore" feature for new users.

### Protocol partnerships

- [ ] **Bitflow.** You are complementary, not competitive. After a user reviews their portfolio in Staxiq and decides to rebalance, the natural CTA is "Swap on Bitflow." A "Best executed via Bitflow" badge on every yield comparison row is mutually beneficial. Reach out to Dylan Floyd (CEO) — public LinkedIn or Twitter.

- [ ] **Zest.** Their dashboard is good but doesn't tell users where else they could deploy. A "View this position in Staxiq" link from Zest's portfolio page is useful for both sides. Likely a slow conversation but worth opening.

- [ ] **Hermetica, StackingDAO, Granite, Alex, Velar.** Same template — once your adapter for each ships, send a courtesy email to the team, "we just integrated, here's the link, here's the methodology, please flag any number that looks wrong."

### Press and content

- [ ] **Reach out to one Stacks-focused outlet** (Stacks blog, Stacks Foundation newsletter, BraveNewCoin's Stacks coverage). Pitch: short interview about why Bitcoin DeFi needs transparent aggregation. They run posts like this regularly.
- [ ] **Twitter/X presence.** A weekly thread highlighting one ecosystem insight (top APYs of the week, cross-validation drift report, new protocol just integrated). Low effort, builds the brand for builders watching the space.

## Wave 4 — Sustaining

Once Wave 1–3 are done, these are the recurring habits that keep the product alive:

- **Monthly methodology updates.** Each time the rubric or data sources change, bump the version, append to the changelog.
- **Quarterly ecosystem report.** Use Staxiq's data to publish quarterly Stacks DeFi reports. This positions Staxiq as a *reference* for the ecosystem, not just a tool. Tenero and DefiLlama do this; you have the same data; you can compete.
- **Issue triage SLA.** Aim for 24h on data discrepancies. Visibly fast issue resolution is itself a trust signal.

## Pitch sentence (memorize this)

> "Bitflow finds the best swap. Staxiq finds the best place to park your Bitcoin — across every Stacks protocol, with open methodology and cross-validated numbers."

That's the one sentence. Use it on your homepage, your Twitter bio, your grant application, and every cold email until you're tired of typing it.
