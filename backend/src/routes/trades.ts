// backend/src/routes/trades.ts
import express from 'express';
import { DuplicateDetection } from '../utils/duplicateDetection';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import SubscriptionService from '../services/subscriptionService';
import { prisma } from '../lib/prisma';

const router = express.Router();

const duplicateDetection = new DuplicateDetection(prisma);

// Interfaces for trade processing
interface ParsedTrade {
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryDate: string;
  entryTime: string;
  entryPrice: number;
  exitDate: string;
  exitTime: string;
  exitPrice: number;
  duration: number;
  pnl: number;
  percentChange: number;
  orderType: string;
  status: 'Open' | 'Closed';
}

interface ImportSummary {
  totalImported: number;
  duplicatesRejected: number;
  longTrades: number;
  shortTrades: number;
  openLongs: number;
  openShorts: number;
}

interface RawTradeData {
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: string; // e.g., "+1", "-2"
  posEffect: 'TO OPEN' | 'TO CLOSE';
  netPrice: number;
  execTime: string; // MM/DD/YY HH:MM:SS
  orderType: string;
}

interface AnalyzedTrade {
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryTime: Date;
  exitTime: Date | null;
  duration: number; // minutes
  entryPrice: number;
  exitPrice: number | null;
  pnl: number;
  percentChange: number;
  orderType: string;
  status: 'Open' | 'Closed';
}

// 🔥 ENHANCED: Get all trades with broker information, pagination, and sorting
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      brokerId, 
      page = '1', 
      limit = '20', 
      sortBy = 'entryDate', 
      sortOrder = 'desc' 
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const whereClause: any = { userId: req.user!.userId };
    if (brokerId) {
      whereClause.brokerId = parseInt(brokerId as string);
    }
    
    // Define valid sort fields and their Prisma field mappings
    const validSortFields: Record<string, string> = {
      'symbol': 'symbol',
      'entryDate': 'entryDate',
      'exitDate': 'exitDate', 
      'pnl': 'pnl',
      'percentChange': 'percentChange',
      'direction': 'direction',
      'quantity': 'quantity',
      'entryPrice': 'entryPrice',
      'exitPrice': 'exitPrice',
      'duration': 'duration',
      'status': 'status',
      'broker': 'brokerId' // Sort by broker ID for database efficiency
    };
    
    // Validate sort parameters
    const sortField = validSortFields[sortBy as string] || 'entryDate';
    const sortDirection = (sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    
    // Get total count for pagination metadata
    const totalCount = await prisma.trade.count({ where: whereClause });
    
    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      },
      orderBy: { [sortField]: sortDirection },
      skip,
      take: limitNum
    });

    res.json({
      trades,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPreviousPage: pageNum > 1
      },
      sorting: {
        sortBy: sortBy as string,
        sortOrder: sortDirection,
        availableFields: Object.keys(validSortFields)
      }
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// 🔥 FIXED: Get trade statistics by broker
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { brokerId } = req.query;
    const whereClause: any = { userId: req.user!.userId };
    if (brokerId) {
      whereClause.brokerId = parseInt(brokerId as string);
    }

    const [
      totalTrades,
      totalPnL,
      winningTrades,
      totalCommission
    ] = await Promise.all([
      prisma.trade.count({ where: whereClause }),
      prisma.trade.aggregate({ where: whereClause, _sum: { pnl: true } }),
      prisma.trade.count({ where: { ...whereClause, pnl: { gt: 0 } } }),
      prisma.trade.aggregate({ where: whereClause, _sum: { commission: true } })
    ]);

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgPnL = totalTrades > 0 ? (totalPnL._sum.pnl || 0) / totalTrades : 0;

    const stats = {
      totalTrades,
      totalPnL: totalPnL._sum.pnl || 0,
      netPnL: (totalPnL._sum.pnl || 0) - (totalCommission._sum.commission || 0),
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate: Math.round(winRate * 10) / 10,
      avgPnL: Math.round(avgPnL * 100) / 100,
      totalCommission: totalCommission._sum.commission || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching trade stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// 🔥 NEW: Dashboard endpoint - combines all dashboard data in one request
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { brokerId } = req.query;
    const whereClause: any = { userId: req.user!.userId };
    if (brokerId) {
      whereClause.brokerId = parseInt(brokerId as string);
    }

    // Fetch all dashboard data in parallel (optimized - no more ALL trades fetch)
    const [
      // Stats data
      totalTrades,
      totalPnL,
      winningTrades,
      totalCommission,
      openTrades,
      closedTrades,
      // Recent trades (last 4)
      recentTrades,
      // Last 10 trades for streak calculation (much more efficient)
      recentTradesForStreak
    ] = await Promise.all([
      prisma.trade.count({ where: whereClause }),
      prisma.trade.aggregate({ where: whereClause, _sum: { pnl: true } }),
      prisma.trade.count({ where: { ...whereClause, pnl: { gt: 0 } } }),
      prisma.trade.aggregate({ where: whereClause, _sum: { commission: true } }),
      prisma.trade.count({ where: { ...whereClause, status: 'Open' } }),
      prisma.trade.count({ where: { ...whereClause, status: 'Closed' } }),
      prisma.trade.findMany({
        where: whereClause,
        include: {
          broker: {
            select: {
              id: true,
              name: true,
              displayName: true,
            }
          }
        },
        orderBy: { entryDate: 'desc' },
        take: 7
      }),
      // Only fetch last 10 trades for streak calculation (not ALL trades!)
      prisma.trade.findMany({
        where: whereClause,
        select: {
          id: true,
          pnl: true,
          entryDate: true
        },
        orderBy: { entryDate: 'desc' },
        take: 10 // Only last 10 trades instead of ALL trades
      })
    ]);

    // Calculate streak efficiently with only last 10 trades
    const calculateStreak = (trades: { pnl: number | null }[]) => {
      if (trades.length === 0) {
        return { type: 'none', count: 0, display: 'No Closed Trades' };
      }

      let longestStreak = 1;
      let longestStreakType = trades[0].pnl! > 0 ? 'win' : 'loss';
      let currentStreak = 1;
      let currentType = longestStreakType;

      for (let i = 1; i < trades.length; i++) {
        const tradeType = trades[i].pnl! > 0 ? 'win' : 'loss';
        
        if (tradeType === currentType) {
          currentStreak++;
        } else {
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
            longestStreakType = currentType;
          }
          currentStreak = 1;
          currentType = tradeType;
        }
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakType = currentType;
      }

      const wins = trades.filter(t => t.pnl! > 0).length;
      const losses = trades.length - wins;
      
      return {
        type: longestStreakType,
        count: longestStreak,
        display: `Last ${trades.length} trades: ${wins} Wins ${losses} Losses\n${longestStreak} consecutive ${longestStreakType}${longestStreak > 1 ? (longestStreakType === 'win' ? 's' : 'es') : ''}`
      };
    };

    const streak = calculateStreak(recentTradesForStreak);

    // Calculate stats
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgPnL = totalTrades > 0 ? (totalPnL._sum.pnl || 0) / totalTrades : 0;

    const stats = {
      totalTrades,
      totalPnL: totalPnL._sum.pnl || 0,
      netPnL: (totalPnL._sum.pnl || 0) - (totalCommission._sum.commission || 0),
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate: Math.round(winRate * 10) / 10,
      avgPnL: Math.round(avgPnL * 100) / 100, // Fixed: renamed from avgTrade to avgPnL
      totalCommission: totalCommission._sum.commission || 0,
      openTrades,
      closedTrades
    };

    res.json({
      stats,
      recentTrades,
      streak, // Return calculated streak instead of ALL trades
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// 🔥 UPDATED: Get trades with filtering and search with pagination
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      symbol, 
      direction, 
      strategy, 
      fromDate,
      tags,
      brokerId,
      status,
      hasNotes,
      hasAssessment,
      page = '1',
      limit = '20',
      sortBy = 'entryDate',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.userId };

    if (symbol) {
      where.symbol = { contains: symbol as string };
    }
    if (direction) {
      where.direction = direction;
    }
    if (strategy) {
      where.strategy = { contains: strategy as string };
    }
    if (fromDate) {
      const fromDateObj = new Date(fromDate as string);
      if (isNaN(fromDateObj.getTime())) {
        console.warn('🔍 Invalid fromDate format:', fromDate);
        return res.status(400).json({ 
          error: 'Invalid fromDate format. Use YYYY-MM-DD format',
          received: fromDate 
        });
      }
      console.log('🔍 FromDate filter applied:', fromDate, '→', fromDateObj);
      where.entryDate = { gte: fromDateObj };
    }
    if (tags) {
      where.tags = { contains: tags as string };
    }
    if (brokerId) {
      where.brokerId = parseInt(brokerId as string);
    }
    if (status) {
      where.status = status as string;
    }

    if (hasNotes !== undefined) {
      const hasNotesBoolean = hasNotes === 'true';
      if (hasNotesBoolean) {
        where.AND = where.AND || [];
        where.AND.push({
          notes: { not: null }
        });
        where.AND.push({
          notes: { not: "" }
        });
      } else {
        where.OR = [
          { notes: null },
          { notes: "" }
        ];
      }
    }

    if (hasAssessment !== undefined) {
      const hasAssessmentBoolean = hasAssessment === 'true';
      if (hasAssessmentBoolean) {
        where.AND = where.AND || [];
        where.AND.push({
          assessment: { not: null }
        });
        where.AND.push({
          assessment: { not: "" }
        });
      } else {
        if (where.OR) {
          where.AND = where.AND || [];
          where.AND.push({ OR: where.OR });
          where.AND.push({
            OR: [
              { assessment: null },
              { assessment: "" }
            ]
          });
          delete where.OR;
        } else {
          where.OR = [
            { assessment: null },
            { assessment: "" }
          ];
        }
      }
    }

    console.log('🔍 Search filters applied:', where);

    // Define valid sort fields and their Prisma field mappings
    const validSortFields: Record<string, string> = {
      'symbol': 'symbol',
      'entryDate': 'entryDate',
      'exitDate': 'exitDate', 
      'pnl': 'pnl',
      'percentChange': 'percentChange',
      'direction': 'direction',
      'quantity': 'quantity',
      'entryPrice': 'entryPrice',
      'exitPrice': 'exitPrice',
      'duration': 'duration',
      'status': 'status',
      'broker': 'brokerId'
    };
    
    // Validate sort parameters
    const sortField = validSortFields[sortBy as string] || 'entryDate';
    const sortDirection = (sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    
    const orderBy = { [sortField]: sortDirection };

    // Get total count for pagination metadata
    const totalCount = await prisma.trade.count({ where });

    const trades = await prisma.trade.findMany({
      where,
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      },
      orderBy,
      skip,
      take: limitNum
    });

    // Calculate date context for enhanced pagination
    let dateContext = undefined;
    const hasDateFilter = fromDate;
    if (hasDateFilter && trades.length > 0) {
      const pageStartDate = trades[0].entryDate;
      const pageEndDate = trades[trades.length - 1].entryDate;
      dateContext = {
        pageStartDate: pageStartDate.toISOString().split('T')[0],
        pageEndDate: pageEndDate.toISOString().split('T')[0],
        totalInRange: totalCount,
        isDateFiltered: true
      };
    }

    console.log(`🔍 Found ${trades.length} trades matching filters (page ${pageNum}/${Math.ceil(totalCount / limitNum)})`);
    if (dateContext) {
      console.log(`🔍 Date context: Page shows ${dateContext.pageStartDate} to ${dateContext.pageEndDate}`);
    }

    res.json({
      trades,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPreviousPage: pageNum > 1
      },
      sorting: {
        sortBy: sortBy as string,
        sortOrder: sortDirection,
        availableFields: Object.keys(validSortFields)
      },
      dateContext
    });
    
  } catch (error) {
    console.error('Error searching trades:', error);
    res.status(500).json({ error: 'Failed to search trades' });
  }
});

// 🔥 NEW: Export trades for AI analysis - optimized with date range filtering
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate are required',
        example: '/api/trades/export?startDate=2025-05-01&endDate=2025-05-31&status=Closed'
      });
    }

    // Validate and parse dates
    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD format',
        received: { startDate, endDate }
      });
    }

    // Build where clause for database filtering
    const where: any = { userId: req.user!.userId };
    
    // Filter by entry date range
    where.entryDate = {
      gte: startDateObj,
      lte: endDateObj
    };
    
    // Filter by status if provided
    if (status) {
      where.status = status as string;
    }

    console.log('🔍 Export query filters:', where);

    // Fetch trades from database with filters applied
    const trades = await prisma.trade.findMany({
      where,
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      },
      orderBy: { entryDate: 'desc' }
    });

    console.log(`🔍 Found ${trades.length} trades for export between ${startDate} and ${endDate}`);

    // Return filtered trades
    res.json({
      trades,
      summary: {
        totalTrades: trades.length,
        dateRange: {
          startDate,
          endDate
        },
        filters: { status }
      }
    });

  } catch (error) {
    console.error('Error exporting trades:', error);
    res.status(500).json({ error: 'Failed to export trades' });
  }
});

// 🔥 ENHANCED: Get single trade with full details including broker
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    
    if (isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }
    
    // Use a valid unique lookup, then enforce ownership
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { broker: true }
    });

    if (!trade || trade.userId !== req.user!.userId) {
      // Hide existence for non-owners
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    res.json(trade);
  } catch (error) {
    console.error('Error fetching trade:', error);
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// 🔥 ENHANCED: Create trade with broker
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Enhanced subscription limits with grace period
    const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
    if (subscriptionStatus && subscriptionStatus.maxTrades > 0) {
      const GRACE_TRADES = 2;
      const effectiveLimit = subscriptionStatus.maxTrades + GRACE_TRADES;
      
      // Check if user has exceeded grace limit
      if (subscriptionStatus.tradeCount >= effectiveLimit) {
        return res.status(403).json({
          error: 'Subscription limit reached',
          message: `You've reached your monthly limit of ${subscriptionStatus.maxTrades} trades plus ${GRACE_TRADES} grace trades.`,
          remaining: 0,
          gracePeriodExhausted: true
        });
      }
      
      // Check if user is entering grace period
      const isEnteringGrace = subscriptionStatus.tradeCount >= subscriptionStatus.maxTrades;
      if (isEnteringGrace) {
        const tradesInGrace = subscriptionStatus.tradeCount - subscriptionStatus.maxTrades + 1;
        const remainingGrace = GRACE_TRADES - tradesInGrace;
        // Continue with trade creation but will return grace period info in response
      }
    }

    const {
      symbol,
      direction,
      quantity,
      entryDate,
      entryTime,
      entryPrice,
      exitDate,
      exitTime,
      exitPrice,
      duration,
      pnl,
      percentChange,
      orderType,
      assessment,
      capital,
      status,
      brokerId,
      notes,
      strategy,
      riskReward,
      commission,
      tags,
      tradeId,
      executionVenue
    } = req.body;

    const broker = await prisma.broker.findUnique({
      where: { id: parseInt(brokerId) }
    });
    
    if (!broker) {
      return res.status(400).json({ error: 'Invalid broker ID' });
    }

    const finalCommission = commission || broker.defaultCommission;

    const trade = await prisma.trade.create({
      data: {
        symbol,
        direction,
        quantity,
        entryDate: new Date(entryDate),
        entryTime,
        entryPrice: parseFloat(entryPrice),
        exitDate: exitDate ? new Date(exitDate) : null,
        exitTime: exitTime ?? null,
        exitPrice: exitPrice != null ? parseFloat(exitPrice) : null,
        duration: duration != null ? String(duration) : '0',
        pnl: parseFloat(pnl),
        percentChange: parseFloat(percentChange),
        orderType,
        assessment,
        capital: parseFloat(capital),
        userId: req.user!.userId,
        brokerId: parseInt(brokerId),
        notes: notes || null,
        strategy: strategy || null,
        riskReward: riskReward || null,
        commission: finalCommission ? parseFloat(finalCommission) : null,
        tags: tags || null,
        tradeId: tradeId || null,
        executionVenue: executionVenue || null,
        status: status || (exitDate && exitPrice != null ? 'Closed' : 'Open')
      },
      include: {
        broker: true
      }
    });

    // Increment subscription trade count
    try {
      await SubscriptionService.incrementTradeCount(userId);
    } catch (subscriptionError) {
      console.error('Error incrementing trade count:', subscriptionError);
      // Don't fail the trade creation if subscription update fails
    }

    // Check if user is now in grace period after adding trade
    let gracePeriodInfo = null;
    if (subscriptionStatus && subscriptionStatus.maxTrades > 0) {
      const newTradeCount = subscriptionStatus.tradeCount + 1;
      if (newTradeCount > subscriptionStatus.maxTrades) {
        const tradesInGrace = newTradeCount - subscriptionStatus.maxTrades;
        const remainingGrace = Math.max(0, 2 - tradesInGrace); // 2 is GRACE_TRADES
        gracePeriodInfo = {
          inGracePeriod: true,
          tradesInGrace,
          remainingGrace,
          message: remainingGrace > 0 
            ? `You've used ${tradesInGrace} of your 2 grace trades. ${remainingGrace} grace trades remaining.`
            : `You've used all your grace trades. Upgrade to continue adding trades next month.`
        };
      }
    }

    res.status(201).json({
      ...trade,
      gracePeriod: gracePeriodInfo
    });
  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    
    if (isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }

    const ownerCheck = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { userId: true }
    });

    if (!ownerCheck || ownerCheck.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const {
      symbol,
      direction,
      quantity,
      entryDate,
      entryTime,
      entryPrice,
      exitDate,
      exitTime,
      exitPrice,
      duration,
      pnl,
      percentChange,
      orderType,
      assessment,
      capital,
      status,
      brokerId,
      notes,
      strategy,
      riskReward,
      commission,
      tags,
      tradeId: brokerTradeId,
      executionVenue
    } = req.body;

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        symbol,
        direction,
        quantity,
        entryDate: new Date(entryDate),
        entryTime,
        entryPrice,
        exitDate: exitDate ? new Date(exitDate) : null,
        exitTime: exitTime ?? null,
        exitPrice: exitPrice != null ? parseFloat(exitPrice) : null,
        duration: duration != null ? String(duration) : '0',
        pnl,
        percentChange,
        orderType,
        assessment,
        capital,
        status,
        brokerId,
        notes,
        strategy,
        riskReward,
        commission,
        tags,
        tradeId: brokerTradeId,
        executionVenue
      },
      include: { broker: true }
    });

    res.json(trade);
  } catch (error) {
    console.error('Error updating trade:', error);
    res.status(500).json({ error: 'Failed to update trade' });
  }
});

// 🔥 NEW: Update only trade notes (for auto-save)
router.patch('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    const { notes } = req.body;

    const ownerCheck = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { userId: true }
    });

    if (!ownerCheck || ownerCheck.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: { 
        notes: notes || null,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, updatedAt: trade.updatedAt });
  } catch (error) {
    console.error('Error updating trade notes:', error);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

// 🔥 NEW: Update only trade assessment (for auto-save)
router.patch('/:id/assessment', authenticateToken, async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    const { assessment } = req.body;

    const ownerCheck = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { userId: true }
    });

    if (!ownerCheck || ownerCheck.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: { 
        assessment: assessment || null,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, updatedAt: trade.updatedAt });
  } catch (error) {
    console.error('Error updating trade assessment:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// 🔥 NEW: Update only trade strategy (for auto-save)
router.patch('/:id/strategy', authenticateToken, async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    const { strategy } = req.body;

    const ownerCheck = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { userId: true }
    });

    if (!ownerCheck || ownerCheck.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: { 
        strategy: strategy || null,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, updatedAt: trade.updatedAt });
  } catch (error) {
    console.error('Error updating trade strategy:', error);
    res.status(500).json({ error: 'Failed to update strategy' });
  }
});

// Delete trade
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);

    const ownerCheck = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { userId: true }
    });

    if (!ownerCheck || ownerCheck.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    await prisma.trade.delete({ where: { id: tradeId } });
    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Error deleting trade:', error);
    res.status(500).json({ error: 'Failed to delete trade' });
  }
});

// Helper function to calculate analytics from trade data
function calculateAnalytics(trades: any[]) {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      totalPL: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      highestGain: 0,
      highestLoss: 0,
      winCount: 0,
      lossCount: 0,
      openTrades: 0,
      totalCapital: 0,
      returnOnCapital: 0,
      avgCapitalPerTrade: 0,
      totalShares: 0,
      losingStreaks: {
        worstStreak: 0,
        totalStreaks: 0,
        avgLength: 0,
        totalDamage: 0,
        avgDamage: 0,
      },
      plTimeSeries: [],
    };
  }

  const totalTrades = trades.length;
  const totalPL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalCapital = trades.reduce((sum, trade) => sum + (trade.capital || 0), 0);
  const totalShares = trades.reduce((sum, trade) => sum + (trade.quantity || 0), 0);

  const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
  const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
  const openTrades = trades.filter(trade => trade.status === 'Open').length;

  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  const avgWin = winCount > 0 ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winCount : 0;
  const avgLoss = lossCount > 0 ? losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / lossCount : 0;

  const highestGain = winCount > 0 ? Math.max(...winningTrades.map(trade => trade.pnl)) : 0;
  const highestLoss = lossCount > 0 ? Math.min(...losingTrades.map(trade => trade.pnl)) : 0;

  const grossProfits = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : (grossProfits > 0 ? 5.0 : 0);

  const returnOnCapital = totalCapital > 0 ? (totalPL / totalCapital) * 100 : 0;
  const avgCapitalPerTrade = totalTrades > 0 ? totalCapital / totalTrades : 0;

  const losingStreaks = calculateLosingStreaks(trades);

  const sortedTrades = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  const plTimeSeries = [];
  let cumulativePL = 0;

  for (const trade of sortedTrades) {
    cumulativePL += trade.pnl || 0;
    plTimeSeries.push({
      date: trade.entryDate,
      cumulativePL: cumulativePL,
    });
  }

  return {
    totalTrades,
    totalPL,
    winRate,
    profitFactor: Math.min(profitFactor, 5.0),
    avgWin,
    avgLoss,
    highestGain,
    highestLoss,
    winCount,
    lossCount,
    openTrades,
    totalCapital,
    returnOnCapital,
    avgCapitalPerTrade,
    totalShares,
    losingStreaks,
    plTimeSeries,
  };
}

// Helper function to calculate losing streaks
function calculateLosingStreaks(trades: any[]) {
  const sortedTrades = [...trades]
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
    .filter(trade => trade.status === 'Closed');

  const streaks = [];
  let currentStreak = [];

  for (const trade of sortedTrades) {
    if ((trade.pnl || 0) < 0) {
      currentStreak.push(trade);
    } else {
      if (currentStreak.length >= 3) {
        streaks.push([...currentStreak]);
      }
      currentStreak = [];
    }
  }

  if (currentStreak.length >= 3) {
    streaks.push(currentStreak);
  }

  if (streaks.length === 0) {
    return {
      worstStreak: 0,
      totalStreaks: 0,
      avgLength: 0,
      totalDamage: 0,
      avgDamage: 0,
    };
  }

  const worstStreak = Math.max(...streaks.map(streak => streak.length));
  const totalStreaks = streaks.length;
  const avgLength = streaks.reduce((sum, streak) => sum + streak.length, 0) / totalStreaks;
  const totalDamage = streaks.reduce((sum, streak) => 
    sum + streak.reduce((streakSum, trade) => streakSum + trade.pnl, 0), 0
  );
  const avgDamage = totalDamage / totalStreaks;

  return {
    worstStreak,
    totalStreaks,
    avgLength,
    totalDamage,
    avgDamage,
  };
}

// Analytics Routes
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.user!.userId },
      include: {
        broker: true,
      },
      orderBy: {
        entryDate: 'asc',
      },
    });

    const analytics = calculateAnalytics(trades);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

router.get('/analytics/daily/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user!.userId,
        entryDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        broker: true,
      },
      orderBy: {
        entryDate: 'asc',
      },
    });

    const analytics = calculateAnalytics(trades);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    res.status(500).json({ error: 'Failed to fetch daily analytics' });
  }
});

router.get('/analytics/weekly/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user!.userId,
        entryDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      include: {
        broker: true,
      },
      orderBy: {
        entryDate: 'asc',
      },
    });

    const analytics = calculateAnalytics(trades);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching weekly analytics:', error);
    res.status(500).json({ error: 'Failed to fetch weekly analytics' });
  }
});

router.get('/analytics/monthly/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user!.userId,
        entryDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        broker: true,
      },
      orderBy: {
        entryDate: 'asc',
      },
    });

    const analytics = calculateAnalytics(trades);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    res.status(500).json({ error: 'Failed to fetch monthly analytics' });
  }
});

router.get('/analytics/ytd/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params;
    const targetYear = parseInt(year);
    
    const startOfYear = new Date(targetYear, 0, 1);
    
    const now = new Date();
    const endOfYear = targetYear === now.getFullYear() 
      ? now 
      : new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user!.userId,
        entryDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      include: {
        broker: true,
      },
      orderBy: {
        entryDate: 'asc',
      },
    });

    const analytics = calculateAnalytics(trades);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching YTD analytics:', error);
    res.status(500).json({ error: 'Failed to fetch YTD analytics' });
  }
});

router.get('/analytics/previous-year/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params;
    const targetYear = parseInt(year);
    
    const startOfYear = new Date(targetYear, 0, 1);
    
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
      where: {
        userId: req.user!.userId,
        entryDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      include: {
        broker: true,
      },
      orderBy: {
        entryDate: 'asc',
      },
    });

    const analytics = calculateAnalytics(trades);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching previous year analytics:', error);
    res.status(500).json({ error: 'Failed to fetch previous year analytics' });
  }
});

// Development route to clear trades
router.delete('/clear-for-testing', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' });
    }
    
    const result = await prisma.trade.deleteMany({});
    
    res.json({
      message: `Cleared ${result.count} trades successfully`,
      deletedCount: result.count
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear trades' });
  }
});

export default router;
