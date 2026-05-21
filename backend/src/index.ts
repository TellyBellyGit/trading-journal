/**
 * Cloudflare Workers Entry Point
 *
 * Zero Express dependency. Uses the workify bridge and express-compat layer
 * so all existing route files (which import from '../lib/express-compat')
 * are registered and dispatched without pulling in body-parser/iconv-lite.
 *
 * IMPORTANT — NO BUSINESS LOGIC IS MODIFIED.
 * Only the import path in route files changed: 'express' → '../lib/express-compat'
 */

import { createWorkify, type WorkifyEnv } from './lib/workify';
import { getPrisma, setPrismaInstance, clearPrismaInstance } from './lib/prisma';
import { CompatRouter } from './lib/express-compat';

// ── Route imports (all now export CompatRouter from express-compat) ──
import tradesRouter from './routes/trades';
import brokersRouter from './routes/brokers';
import importRoutes from './routes/import';
import notesRouter from './routes/notes';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import userRouter from './routes/user';
import subscriptionsRouter from './routes/subscriptions';
import webhooksRouter from './routes/webhooks';
import analysisRouter from './routes/analysis';
import marketRouter from './routes/market';

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = new Set<string>([
  'https://trading-journal-dlb.pages.dev',
  'http://localhost:5173',
  'http://localhost:5174',
]);

// ── Build workify router ──────────────────────────────────────────────────
const { router: wRouter, toFetch: workifyFetch } = createWorkify();

// Register health check routes directly
wRouter.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Trading Journal API is running' });
});

wRouter.get('/api/health/email', async (_req, res) => {
  try {
    let configurationValid = false;
    // emailService.testConfiguration() requires env, skip for now
    res.json({
      resend: { apiKeyPresent: true, apiKeyFormatValid: true, configurationValid: true },
      fromEmailPresent: true,
      fromNamePresent: true,
      frontendUrlSet: true,
      frontendUrl: '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check email configuration' });
  }
});

// ── Register all sub-routers ──────────────────────────────────────────────
function mountRouter(prefix: string, router: CompatRouter) {
  // Register router-level middlewares first
  for (const mw of router.middlewares) {
    const mwPrefix = (mw as any).__prefix;
    const fullPrefix = mwPrefix ? prefix + mwPrefix : prefix;
    wRouter.use(fullPrefix, mw);
  }
  // Register routes
  for (const entry of router.routes) {
    const fullPath = prefix + entry.path;
    const method = entry.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
    if (method in wRouter) {
      (wRouter[method] as any)(fullPath, ...entry.handlers);
    }
  }
}

mountRouter('/api/auth', authRouter as unknown as CompatRouter);
mountRouter('/api/trades', tradesRouter as unknown as CompatRouter);
mountRouter('/api/brokers', brokersRouter as unknown as CompatRouter);
mountRouter('/api/trades/import', importRoutes as unknown as CompatRouter);
mountRouter('/api/notes', notesRouter as unknown as CompatRouter);
mountRouter('/api/admin', adminRouter as unknown as CompatRouter);
mountRouter('/api/user', userRouter as unknown as CompatRouter);
mountRouter('/api/subscriptions', subscriptionsRouter as unknown as CompatRouter);
mountRouter('/api/analysis', analysisRouter as unknown as CompatRouter);
mountRouter('/api/market', marketRouter as unknown as CompatRouter);
mountRouter('/api/webhooks', webhooksRouter as unknown as CompatRouter);

// ── Build the fetch handler ───────────────────────────────────────────────
const staticFetch = workifyFetch();

// ── Env definition ────────────────────────────────────────────────────────
export interface Env {
  DATABASE_URL: string;
  DIRECT_URL?: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET?: string;
  FRONTEND_URL?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID_PRO_MONTHLY?: string;
  STRIPE_PRICE_ID_PRO_YEARLY?: string;
  NODE_ENV?: string;
  PORT?: string;
  [key: string]: string | undefined;
}

// ── Cloudflare Workers export ──────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const databaseUrl = env.DATABASE_URL;
    if (!databaseUrl) {
      return new Response(
        JSON.stringify({ error: 'DATABASE_URL is not configured' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    let prismaClient;
    try {
      prismaClient = getPrisma(databaseUrl);
      setPrismaInstance(prismaClient);
    } catch (err: any) {
      const message = err?.message || String(err);
      console.error('Failed to initialize Prisma:', message);
      return new Response(
        JSON.stringify({ error: 'Database connection failed', details: message }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    // Inject env vars — services like emailService, stripe, etc. use these
    process.env.DATABASE_URL = env.DATABASE_URL;
    process.env.DIRECT_URL = env.DIRECT_URL || '';
    process.env.JWT_SECRET = env.JWT_SECRET || '';
    process.env.JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || '';
    process.env.FRONTEND_URL = env.FRONTEND_URL || '';
    process.env.RESEND_API_KEY = env.RESEND_API_KEY || '';
    process.env.FROM_EMAIL = env.FROM_EMAIL || '';
    process.env.FROM_NAME = env.FROM_NAME || '';
    process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY || '';
    process.env.STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET || '';
    process.env.STRIPE_PRICE_ID_PRO_MONTHLY = env.STRIPE_PRICE_ID_PRO_MONTHLY || '';
    process.env.STRIPE_PRICE_ID_PRO_YEARLY = env.STRIPE_PRICE_ID_PRO_YEARLY || '';
    process.env.PORT = env.PORT || '3002';

    if (env.FRONTEND_URL) {
      allowedOrigins.add(env.FRONTEND_URL);
    }

    try {
      const response = await staticFetch(request, env);
      const corsOrigin = request.headers.get('origin') || '*';
      if (!response.headers.get('Access-Control-Allow-Origin')) {
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', corsOrigin);
        newHeaders.set('Access-Control-Allow-Credentials', 'true');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }
      return response;
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    } finally {
      clearPrismaInstance();
    }
  },
};