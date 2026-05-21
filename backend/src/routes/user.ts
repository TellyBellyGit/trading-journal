// backend/src/routes/user.ts
import express from '../lib/express-compat';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const router = express.Router();

// DELETE /api/user/clear-data - Clear all user-specific data (allow users to delete their own data)
router.delete('/clear-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    
    logger.warning('CLEAR DATA REQUEST initiated', req);

    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete user's notes
      const deletedNotes = await tx.note.deleteMany({
        where: { userId }
      });

      // Delete user's trades
      const deletedTrades = await tx.trade.deleteMany({
        where: { userId }
      });

      // Note: We deliberately keep brokers as they are global/shared
      
      logger.data('DELETED', 'Notes', deletedNotes.count, req);
      logger.data('DELETED', 'Trades', deletedTrades.count, req);
      logger.info('Brokers preserved (global resource)', req);
    });

    logger.success('CLEAR DATA COMPLETED successfully', req);
    
    res.json({
      message: 'User data cleared successfully',
      cleared: {
        notes: true,
        trades: true,
        brokers: false // Kept as global resource
      }
    });

  } catch (error) {
    logger.error('CLEAR DATA FAILED', error, req);
    res.status(500).json({ 
      error: 'Failed to clear user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/user/stats - Get user data statistics (for verification)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [tradesCount, notesCount, brokersCount] = await Promise.all([
      prisma.trade.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.broker.count() // Global count, not user-specific
    ]);

    res.json({
      userId,
      userEmail: req.user!.email,
      stats: {
        trades: tradesCount,
        notes: notesCount,
        brokers: brokersCount // Global resource
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;