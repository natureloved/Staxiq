# Staxiq

> **Bitflow finds the best swap. Staxiq finds the best place to park your Bitcoin.**

Staxiq is a portfolio and yield aggregator for Bitcoin DeFi on Stacks. It gives sBTC and STX holders a single, transparent view of every position they hold across the Stacks ecosystem — Zest, Granite, StackingDAO, Bitflow, Alex, Hermetica, native PoX stacking, and more.

[Live app →](https://staxiq.vercel.app) · [Methodology](docs/METHODOLOGY.md) · [Health score rubric](docs/HEALTH_SCORE.md)

![Staxiq dashboard](public/banner.png)

## What it does

- **Portfolio overview.** Real-time STX, sBTC, and protocol-position tracking. Read-only mode lets you inspect any address — no wallet connection required.
- **Yield comparison.** Live APYs across every integrated protocol, with TVL cross-validated against DefiLlama. We show you when our number disagrees with theirs.
- **Wallet Health Score.** A transparent, versioned 0–100 rubric covering protocol concentration, liquidation buffer, idle capital, asset diversity, and smart-contract risk exposure. [Every rule is open-source.](docs/HEALTH_SCORE.md)
- **AI Copilot.** Recommendations grounded in your actual on-chain state. Every suggestion references a specific fact in your portfolio; ungrounded outputs are dropped before they reach you.
- **Native PoX stacking.** Track your real BTC yield from native Stacks stacking alongside your DeFi positions.

## What it's not

Staxiq is not a DEX, not a swap aggregator, and not a custodian. We're complementary to Bitflow (swap routing) and the protocols we integrate. Every transaction is signed locally by your wallet.

## Tech stack

- **Frontend:** Vite + React + Tailwind CSS, Recharts
- **Wallets:** `@stacks/connect`, `@stacks/transactions` (Leather, Xverse)
- **Backend:** Express, with a clean adapter layer (`server/integrations/`) for every protocol
- **Smart contracts:** Clarity (in `staxiq-contracts/`)

## Architecture

The backend is built around a single contract — `ProtocolAdapter` — that every integration implements:

```
server/
├── integrations/
│   ├── types.js            # adapter contract (JSDoc types)
│   ├── registry.js         # the only file that knows the full list of protocols
│   ├── cache.js            # TTL cache with in-flight de-duplication
│   ├── crossval.js         # DefiLlama cross-validation
│   └── adapters/
│       ├── zest.js
│       ├── poxStacking.js
│       └── ... (one file per protocol)
├── healthScore/
│   ├── rubric.js           # versioned, open-source scoring rules
│   └── score.js
├── ai/
│   ├── prompt.js           # strict JSON-output system prompt
│   ├── copilot.js          # post-validates groundedness
│   └── insights/           # structured insight detectors
└── routes/
    └── readonly.js         # public read-only endpoints
```

Adding a new protocol takes one file: implement `ProtocolAdapter`, register it in `registry.js`, document risk + sources in [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md).

## Getting started

### Prerequisites

- Node.js v18+
- [Leather](https://leather.io/) or [Xverse](https://www.xverse.app/) wallet (for connected mode)

### Installation

```bash
git clone https://github.com/natureloved/Staxiq.git
cd Staxiq
npm install
cp .env.example .env.local       # add ZEST_API_BASE, etc.
npm run dev
```

Open [http://localhost:3005](http://localhost:3005).

### Environment variables

| Variable | Purpose |
|---|---|
| `ZEST_API_BASE` | Zest Protocol API base URL |
| `STACKS_NETWORK` | `mainnet` or `testnet` |
| `OPENAI_API_KEY` | Optional, enables AI Copilot |

## Roadmap

- [x] Adapter architecture + Zest + native PoX
- [x] Transparent Wallet Health Score (rubric v0.1.0)
- [x] Read-only research mode (no wallet required)
- [x] Grounded AI Copilot
- [ ] Granite, StackingDAO, Bitflow, Alex, Hermetica, Velar adapters
- [ ] Public protocol pages (`/protocols/:slug`)
- [ ] Telegram + email alerts (HF drops, APY spikes, new high-yield offerings)
- [ ] In-wallet integration (Leather, Xverse)
- [ ] Stacks Foundation grant application

## Security & trust

- **Non-custodial.** Staxiq never asks for private keys. All transactions are signed in your wallet.
- **Transparent data.** Every number on Staxiq has a source link and an `asOf` timestamp. TVLs are cross-validated against DefiLlama and drift is shown publicly at `/api/health`.
- **Versioned methodology.** The Wallet Health Score rubric is versioned and open-source; historical scores remain reproducible across rule changes.

## Contributing

This is currently a single-maintainer project. PRs adding protocol adapters, fixing data discrepancies, or improving the rubric are very welcome.

## License

MIT © 2026 Staxiq
