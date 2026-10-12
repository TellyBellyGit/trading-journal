import app from './app';
import { prisma } from './lib/prisma';

const PORT = process.env.PORT || 3002;

// ── Startup: Fix auto-increment sequences ──────────────────────────────────
async function fixSequences() {
  try {
    // Reset Trade sequence to match actual max ID + 1
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Trade"', 'id'), COALESCE((SELECT MAX(id) FROM "Trade"), 1))
    `);
    console.log('✅ Trade ID sequence reset to match existing data');
  } catch (err) {
    console.error('⚠️ Failed to fix sequences (non-fatal):', err);
  }
}

// ── Start server ──────────────────────────────────────────────────────────
(async () => {
  await fixSequences();
  app.listen(PORT, () => {
    console.log(`🚀 Trading Journal API running on port ${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  });
})();

