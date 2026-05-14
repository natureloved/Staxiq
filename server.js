import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { createMemoryCache } from './server/integrations/cache.js';
import { mountReadOnlyRoutes } from './server/routes/readonly.js';
import { mountCopilotRoutes } from './server/routes/copilot.js';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

// CORS — accepts comma-separated origins from env; defaults to localhost for dev
const allowedOrigins = (
  process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173'
).split(',').map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, same-origin, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '64kb' }));
app.use(pinoHttp({ logger }));

// Rate limiting — 30 req/min per IP on all /api/* routes
const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});
app.use('/api/', apiLimiter);

const adapterCtx = {
  network: process.env.STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  fetch: (url, init) => fetch(url, init),
  cache: createMemoryCache(),
  log: (msg, meta) => logger.info({ msg, ...meta }),
};

mountReadOnlyRoutes(app, adapterCtx);
mountCopilotRoutes(app, adapterCtx);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  logger.info(`Staxiq proxy server running on http://localhost:${PORT}`);
});
