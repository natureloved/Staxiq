import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createMemoryCache } from './server/integrations/cache.js';
import { mountReadOnlyRoutes } from './server/routes/readonly.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const adapterCtx = {
  network: process.env.STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  fetch: (url, init) => fetch(url, init),
  cache: createMemoryCache(),
  log: (msg, meta) => console.log('[adapter]', msg, meta ?? ''),
};

mountReadOnlyRoutes(app, adapterCtx);

// Express server running natively.

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`✅ Staxiq proxy server running on http://localhost:${PORT}`);
});
