import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// ── Route imports ──────────────────────────────────────────────────────────
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

const app = express();
const PORT = process.env.PORT || 3002;

// ── Startup: Fix auto-increment sequences ──────────────────────────────────
async function fixSequences() {
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    // Reset Trade sequence to match actual max ID + 1
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Trade"', 'id'), COALESCE((SELECT MAX(id) FROM "Trade"), 1))
    `);
    console.log('✅ Trade ID sequence reset to match existing data');
    await prisma.$disconnect();
  } catch (err) {
    console.error('⚠️ Failed to fix sequences (non-fatal):', err);
  }
}

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://trading-journal-dlb.pages.dev',
  'http://localhost:5173',
  'http://localhost:5174',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Always allow in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(null, true); // Allow all for now
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Trading Journal API is running', version: '4.0.0', platform: 'render' });
});

// ── Mount routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/brokers', brokersRouter);
app.use('/api/trades/import', importRoutes);
app.use('/api/notes', notesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/market', marketRouter);
app.use('/api/webhooks', webhooksRouter);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err?.message || err);
  res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
});

// ── Start server ──────────────────────────────────────────────────────────
(async () => {
  await fixSequences();
  app.listen(PORT, () => {
    console.log(`🚀 Trading Journal API running on port ${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  });
})();
