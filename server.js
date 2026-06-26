import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { createMemoryCache } from './server/integrations/cache.js';
import { mountReadOnlyRoutes } from './server/routes/readonly.js';
import { mountStackingRoutes } from './server/routes/stacking.js';
import { mountCopilotRoutes } from './server/routes/copilot.js';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

// CORS — strict: only allow origins from CORS_ORIGINS env var (comma-separated)
// Falls back to localhost only in development
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = (
  process.env.CORS_ORIGINS || (isProd ? '' : 'http://localhost:3000,http://localhost:5173')
).split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl / server-to-server
    if (!isProd) return cb(null, true); // allow all in dev
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));
app.use(pinoHttp({ logger }));

// ── Security headers (helmet-like, no dependency) ──────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isProd) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.hiro.so https://api.coingecko.com https://api.zestprotocol.com https://api.granite.world; font-src 'self' data:; frame-ancestors 'none';"
    );
  }
  next();
});

// ── Rate limiting ───────────────────────────────────────────────────────────
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

const apiLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});
app.use('/api/', apiLimiter);

// ── Address input sanitization ──────────────────────────────────────────────
app.use('/api/research/:address', (req, _res, next) => {
  const raw = String(req.params.address || '').trim();
  const sanitized = raw.replace(/[^SMPNT0-9A-HJKMNP-Z]/gi, '');
  if (sanitized !== raw) {
    return _res.status(400).json({ error: 'invalid characters in address' });
  }
  req.params.address = sanitized;
  next();
});

const adapterCtx = {
  network: process.env.STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  fetch: (url, init) => fetch(url, init),
  cache: createMemoryCache(adapterCtx),
  log: (msg, meta) => logger.info({ msg, ...meta }),
};

mountReadOnlyRoutes(app, adapterCtx);
mountStackingRoutes(app, adapterCtx);
mountCopilotRoutes(app, adapterCtx);

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  logger.info(`Staxiq proxy server running on http://${HOST}:${PORT}`);
});
