// backend/src/routes/brokers.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all brokers
router.get('/', async (req, res) => {
  try {
    const brokers = await prisma.broker.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { trades: true }
        }
      }
    });
    res.json(brokers);
  } catch (error: any) {
    console.error('Error fetching brokers:', error);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// Get single broker with trade count
router.get('/:id', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    const broker = await prisma.broker.findUnique({
      where: { id: brokerId },
      include: {
        _count: {
          select: { trades: true }
        }
      }
    });
    
    if (!broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }
    
    res.json(broker);
  } catch (error: any) {
    console.error('Error fetching broker:', error);
    res.status(500).json({ error: 'Failed to fetch broker' });
  }
});

// Create new broker
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      displayName,
      accountType,
      accountId,
      defaultCommission,
      commissionType,
      isActive = true
    } = req.body;

    const broker = await prisma.broker.create({
      data: {
        name,
        displayName,
        accountType: accountType || null,
        accountId: accountId || null,
        defaultCommission: defaultCommission ? parseFloat(defaultCommission) : null,
        commissionType: commissionType || null,
        isActive,
        userId: req.user!.userId
      }
    });

    res.status(201).json(broker);
  } catch (error: any) {
    console.error('Error creating broker:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Broker name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create broker' });
    }
  }
});

// Update broker
router.put('/:id', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    const {
      name,
      displayName,
      accountType,
      accountId,
      defaultCommission,
      commissionType,
      isActive
    } = req.body;

    const broker = await prisma.broker.update({
      where: { id: brokerId },
      data: {
        name,
        displayName,
        accountType: accountType || null,
        accountId: accountId || null,
        defaultCommission: defaultCommission ? parseFloat(defaultCommission) : null,
        commissionType: commissionType || null,
        isActive
      }
    });

    res.json(broker);
  } catch (error: any) {
    console.error('Error updating broker:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Broker name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update broker' });
    }
  }
});

// Delete broker (only if no trades)
router.delete('/:id', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    
    // Check if broker has trades
    const tradeCount = await prisma.trade.count({
      where: { brokerId }
    });
    
    if (tradeCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete broker. It has ${tradeCount} associated trades. Consider deactivating instead.` 
      });
    }

    await prisma.broker.delete({
      where: { id: brokerId }
    });
    
    res.json({ message: 'Broker deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting broker:', error);
    res.status(500).json({ error: 'Failed to delete broker' });
  }
});

// Get broker performance stats
router.get('/:id/stats', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    
    const [
      broker,
      totalTrades,
      totalPnL,
      winningTrades,
      totalCommission,
      avgDuration
    ] = await Promise.all([
      prisma.broker.findUnique({ where: { id: brokerId } }),
      prisma.trade.count({ where: { brokerId } }),
      prisma.trade.aggregate({ 
        where: { brokerId }, 
        _sum: { pnl: true } 
      }),
      prisma.trade.count({ 
        where: { brokerId, pnl: { gt: 0 } } 
      }),
      prisma.trade.aggregate({ 
        where: { brokerId }, 
        _sum: { commission: true } 
      }),
      prisma.trade.findMany({
        where: { brokerId },
        select: { duration: true }
      })
    ]);

    if (!broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgPnL = totalTrades > 0 ? (totalPnL._sum.pnl || 0) / totalTrades : 0;
    const netPnL = (totalPnL._sum.pnl || 0) - (totalCommission._sum.commission || 0);

    // Calculate average trade duration (simplified - assumes duration is in consistent format)
    const avgDurationCalc = avgDuration.length > 0 ? 
      avgDuration.reduce((sum, trade) => {
        // Simple duration parsing - you might want to improve this based on your duration format
        const days = parseFloat(trade.duration) || 0;
        return sum + days;
      }, 0) / avgDuration.length : 0;

    res.json({
      broker,
      stats: {
        totalTrades,
        totalPnL: totalPnL._sum.pnl || 0,
        netPnL,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
        winRate: Math.round(winRate * 10) / 10,
        avgPnL: Math.round(avgPnL * 100) / 100,
        totalCommission: totalCommission._sum.commission || 0,
        avgDuration: Math.round(avgDurationCalc * 10) / 10
      }
    });
  } catch (error: any) {
    console.error('Error fetching broker stats:', error);
    res.status(500).json({ error: 'Failed to fetch broker statistics' });
  }
});

export default router;