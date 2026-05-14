# Registry update for Granite adapter

In `server/integrations/registry.js`, make these two changes.

## 1. Uncomment the import

Find this block near the top of the file:

```js
// import { graniteAdapter } from './adapters/granite.js';
// import { stackingDaoAdapter } from './adapters/stackingDao.js';
// ...
```

Change the Granite line to:

```js
import { graniteAdapter } from './adapters/granite.js';
// import { stackingDaoAdapter } from './adapters/stackingDao.js';
// ...
```

## 2. Uncomment the registration

Find the `ADAPTERS` array:

```js
const ADAPTERS = [
  zestAdapter,
  poxStackingAdapter,
  // graniteAdapter,
  // stackingDaoAdapter,
  ...
];
```

Change it to:

```js
const ADAPTERS = [
  zestAdapter,
  poxStackingAdapter,
  graniteAdapter,
  // stackingDaoAdapter,
  ...
];
```

## 3. Add the env var

In your `.env.local`:

```
GRANITE_API_BASE=https://api.granite.world
```

(Replace with the real API base URL from https://docs.granite.world once you've confirmed it. The endpoint shape the adapter expects: `GET /v1/markets` returning `[{ id, borrowAsset, collateralAsset, supplyApy, borrowApy, totalSuppliedUsd, totalCollateralUsd, totalBorrowedUsd, ... }]` and `GET /v1/users/:address/positions` returning `{ liquidityPositions, vaults }`.)

## 4. Verify

Run:

```bash
curl http://localhost:3005/api/yields | jq '.ok | map(select(.protocolSlug == "granite")) | length'
```

Should return `>= 1` (at least one Granite market surfaced).

```bash
curl http://localhost:3005/api/health | jq '.reports[] | select(.protocolSlug == "granite")'
```

Should return a cross-validation report with confidence `ok`, `warn`, or `fail` — confirming the DefiLlama check is wired through the registry.
