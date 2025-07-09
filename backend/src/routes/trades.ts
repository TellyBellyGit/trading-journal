// backend/src/routes/trades.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { DuplicateDetection } from '../utils/duplicateDetection';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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

// 🔥 ENHANCED: Get all trades with broker information and pagination
router.get('/', async (req, res) => {
  try {
    const { brokerId, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const whereClause = brokerId ? { brokerId: parseInt(brokerId as string) } : {};
    
    // Get total count for pagination metadata
    const totalCount = await prisma.trade.count({ where: whereClause });
    
    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            displayName: true,
            accountType: true
          }
        }
      },
      orderBy: { entryDate: 'desc' },
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
      }
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// 🔥 FIXED: Get trade statistics by broker
router.get('/stats', async (req, res) => {
  try {
    const { brokerId } = req.query;
    const whereClause = brokerId ? { brokerId: parseInt(brokerId as string) } : {};

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

// 🔥 UPDATED: Get trades with filtering and search with pagination
router.get('/search', async (req, res) => {
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
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

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

    // Smart sorting: if date filtering is active, sort by entryDate ASC (oldest first)
    // This ensures users see trades starting from their selected date
    const hasDateFilter = fromDate;
    const orderBy = hasDateFilter ? { entryDate: 'asc' as const } : { entryDate: 'desc' as const };

    // Get total count for pagination metadata
    const totalCount = await prisma.trade.count({ where });

    const trades = await prisma.trade.findMany({
      where,
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            displayName: true,
            accountType: true
          }
        }
      },
      orderBy,
      skip,
      take: limitNum
    });

    // Calculate date context for enhanced pagination
    let dateContext = undefined;
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
      dateContext
    });
    
  } catch (error) {
    console.error('Error searching trades:', error);
    res.status(500).json({ error: 'Failed to search trades' });
  }
});

// 🔥 NEW: Export trades for AI analysis - optimized with date range filtering
router.get('/export', async (req, res) => {
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
    const where: any = {};
    
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
router.get('/:id', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    
    if (isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }
    
    const trade = await prisma.trade.findUnique({
      where: {
        id: tradeId
      },
      include: {
        broker: true
      }
    });
    
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    res.json(trade);
  } catch (error) {
    console.error('Error fetching trade:', error);
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// 🔥 ENHANCED: Create trade with broker
router.post('/', async (req, res) => {
  try {
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
        exitDate: new Date(exitDate),
        exitTime,
        exitPrice: parseFloat(exitPrice),
        duration,
        pnl: parseFloat(pnl),
        percentChange: parseFloat(percentChange),
        orderType,
        assessment,
        capital: parseFloat(capital),
        brokerId: parseInt(brokerId),
        notes: notes || null,
        strategy: strategy || null,
        riskReward: riskReward || null,
        commission: finalCommission ? parseFloat(finalCommission) : null,
        tags: tags || null,
        tradeId: tradeId || null,
        executionVenue: executionVenue || null
      },
      include: {
        broker: true
      }
    });

    res.status(201).json(trade);
  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    
    if (isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
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
        exitDate: new Date(exitDate),
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
      },
      include: {
        broker: true
      }
    });

    res.json(trade);
  } catch (error) {
    console.error('Error updating trade:', error);
    res.status(500).json({ error: 'Failed to update trade' });
  }
});

// 🔥 NEW: Update only trade notes (for auto-save)
router.patch('/:id/notes', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    const { notes } = req.body;

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
router.patch('/:id/assessment', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    const { assessment } = req.body;

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
router.patch('/:id/strategy', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    const { strategy } = req.body;

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
router.delete('/:id', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    await prisma.trade.delete({
      where: { id: tradeId }
    });
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
router.get('/analytics/summary', async (req, res) => {
  try {
    const trades = await prisma.trade.findMany({
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

router.get('/analytics/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
      where: {
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

router.get('/analytics/weekly/:date', async (req, res) => {
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

router.get('/analytics/monthly/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
      where: {
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

router.get('/analytics/ytd/:year', async (req, res) => {
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

router.get('/analytics/previous-year/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const targetYear = parseInt(year);
    
    const startOfYear = new Date(targetYear, 0, 1);
    
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const trades = await prisma.trade.findMany({
      where: {
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

// POST /api/trades/import/process - Process CSV file and detect duplicates
router.post('/import/process', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'No file uploaded',
          details: ['Please select a CSV file']
        }
      });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    
    const parsedTrades = await parseCSVContent(csvContent);
    
    if (parsedTrades.length === 0) {
      return res.status(400).json({
        error: {
          message: 'No trades found in CSV file',
          details: ['Please check the file format and try again']
        }
      });
    }

    const brokerId = 1;
    const duplicateResult = await duplicateDetection.detectDuplicatesBatch(parsedTrades, brokerId);

    const summary: ImportSummary = {
      totalImported: duplicateResult.uniqueTrades.length,
      duplicatesRejected: duplicateResult.duplicateCount,
      longTrades: duplicateResult.uniqueTrades.filter(t => t.direction === 'Long').length,
      shortTrades: duplicateResult.uniqueTrades.filter(t => t.direction === 'Short').length,
      openLongs: duplicateResult.uniqueTrades.filter(t => t.direction === 'Long' && t.status === 'Open').length,
      openShorts: duplicateResult.uniqueTrades.filter(t => t.direction === 'Short' && t.status === 'Open').length,
    };

    res.json({
      trades: duplicateResult.uniqueTrades,
      summary,
      duplicateDetails: duplicateResult.duplicateDetails
    });

  } catch (error) {
    console.error('Import process error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process CSV file',
        details: ['Please check file format and try again']
      }
    });
  }
});

// POST /api/trades/import/save - Save unique trades to database
router.post('/import/save', async (req, res) => {
  try {
    const { trades, brokerId } = req.body;

    if (!trades || !Array.isArray(trades)) {
      return res.status(400).json({
        error: {
          message: 'Invalid trades data',
          details: ['Trades array is required']
        }
      });
    }

    const duplicateResult = await duplicateDetection.detectDuplicatesBatch(trades, brokerId || 1);
    
    if (duplicateResult.uniqueTrades.length === 0) {
      return res.json({
        message: 'No new trades to save - all were duplicates',
        summary: {
          saved: 0,
          duplicatesRejected: duplicateResult.duplicateCount
        }
      });
    }

    const tradesForDB = duplicateResult.uniqueTrades.map(trade => ({
      symbol: trade.symbol,
      direction: trade.direction,
      quantity: trade.quantity,
      entryDate: new Date(trade.entryDate),
      entryTime: trade.entryTime,
      entryPrice: trade.entryPrice,
      exitDate: new Date(trade.exitDate),
      exitTime: trade.exitTime,
      exitPrice: trade.exitPrice,
      duration: trade.duration.toString(),
      pnl: trade.pnl,
      percentChange: trade.percentChange,
      orderType: trade.orderType,
      status: trade.status,
      brokerId: brokerId || 1,
      assessment: null,
      capital: trade.entryPrice * trade.quantity,
      notes: null,
      strategy: null,
      riskReward: null,
      commission: null,
      tags: null,
      tradeId: null,
      executionVenue: null
    }));

    const result = await prisma.trade.createMany({
      data: tradesForDB
    });

    res.json({
      message: `Successfully imported ${result.count} trades`,
      summary: {
        saved: result.count,
        duplicatesRejected: duplicateResult.duplicateCount
      }
    });

  } catch (error) {
    console.error('Import save error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to save trades to database',
        details: ['Please try again or contact support']
      }
    });
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

// ========== TRADE MATCHING LOGIC ==========

async function parseCSVContent(csvContent: string): Promise<ParsedTrade[]> {
  console.log('🔍 Starting CSV parsing with trade matching...');
  
  try {
    // Step 1: Extract trade history section
    const tradeHistoryContent = extractTradeHistorySection(csvContent);
    
    if (!tradeHistoryContent) {
      console.log('❌ No "Account Trade History" section found');
      return [];
    }
    
    // Step 2: Parse CSV into raw executions
    const rawTrades = parseCSVToRawTrades(tradeHistoryContent);
    
    if (rawTrades.length === 0) {
      console.log('❌ No valid executions found');
      return [];
    }
    
    console.log(`📊 Parsed ${rawTrades.length} raw executions`);
    
    // Step 3: Analyze and match trades using working logic
    const analyzedTrades = analyzeTradesWithMatching(rawTrades);
    
    // Step 4: Convert to ParsedTrade format
    const parsedTrades = convertToParseTradeFormat(analyzedTrades);
    
    console.log(`✅ Successfully matched ${parsedTrades.length} complete trades`);
    return parsedTrades;
    
  } catch (error) {
    console.error('❌ CSV parsing error:', error);
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractTradeHistorySection(csvContent: string): string | null {
  const lines = csvContent.split('\n');
  let foundTradeHistory = false;
  let nextIsHeader = false;
  const extractedLines: string[] = [];

  for (const line of lines) {
    if (line.toLowerCase().includes('account trade history')) {
      console.log('🔍 Found "Account Trade History" section');
      foundTradeHistory = true;
      nextIsHeader = true;
      continue;
    }

    if (nextIsHeader) {
      extractedLines.push(line);
      nextIsHeader = false;
      continue;
    }

    if (foundTradeHistory) {
      if (line.trim() === '' || line.replace(/,/g, '').trim() === '') {
        break;
      }
      extractedLines.push(line);
    }
  }

  return extractedLines.length > 0 ? extractedLines.join('\n') : null;
}

function parseCSVToRawTrades(csvContent: string): RawTradeData[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const symbolIndex = headers.findIndex(h => h.includes('symbol'));
  const sideIndex = headers.findIndex(h => h.includes('side'));
  const qtyIndex = headers.findIndex(h => h.includes('qty'));
  const posEffectIndex = headers.findIndex(h => h.includes('pos effect'));
  const netPriceIndex = headers.findIndex(h => h.includes('net price') || h.includes('price'));
  const execTimeIndex = headers.findIndex(h => h.includes('exec time') || h.includes('time'));
  const orderTypeIndex = headers.findIndex(h => h.includes('order type') || h.includes('type'));

  if (symbolIndex === -1 || sideIndex === -1 || qtyIndex === -1 || 
      posEffectIndex === -1 || netPriceIndex === -1 || execTimeIndex === -1) {
    throw new Error('Missing required columns in CSV file');
  }

  const rawTrades: RawTradeData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    
    if (cells.length < headers.length) continue;

    try {
      const symbol = cells[symbolIndex];
      if (symbol.includes(' ') && (symbol.includes('C') || symbol.includes('P'))) {
        console.log(`⚠️ Skipping options trade: ${symbol}`);
        continue;
      }

      rawTrades.push({
        symbol: symbol.toUpperCase(),
        side: cells[sideIndex].toUpperCase() as 'BUY' | 'SELL',
        qty: cells[qtyIndex],
        posEffect: cells[posEffectIndex].toUpperCase() as 'TO OPEN' | 'TO CLOSE',
        netPrice: parseFloat(cells[netPriceIndex].replace(/[$,]/g, '')),
        execTime: cells[execTimeIndex],
        orderType: orderTypeIndex !== -1 ? cells[orderTypeIndex] : 'UNKNOWN'
      });
    } catch (error) {
      console.warn(`⚠️ Skipping invalid row ${i + 1}:`, error);
    }
  }

  return rawTrades;
}

function analyzeTradesWithMatching(rawTrades: RawTradeData[]): AnalyzedTrade[] {
  const cleanTrades = cleanTradeData(rawTrades);
  const symbols = [...new Set(cleanTrades.map(t => t.symbol))];
  const analyzedTrades: AnalyzedTrade[] = [];

  for (const symbol of symbols) {
    const symbolTrades = cleanTrades.filter(t => t.symbol === symbol);
    const openLongPositions: { quantity: number; trade: RawTradeData; }[] = [];
    const openShortPositions: { quantity: number; trade: RawTradeData; }[] = [];

    for (const trade of symbolTrades) {
      const quantity = parseQuantity(trade.qty);
      const execTime = parseDateTime(trade.execTime)!;

      if (trade.posEffect === 'TO OPEN') {
        if (trade.side === 'BUY') {
          openLongPositions.push({ quantity, trade });
        } else if (trade.side === 'SELL') {
          openShortPositions.push({ quantity, trade });
        }
      } else if (trade.posEffect === 'TO CLOSE') {
        if (trade.side === 'SELL' && openLongPositions.length > 0) {
          // Closing long positions (FIFO)
          let qtyRemaining = quantity;
          const sellPrice = trade.netPrice;
          const sellTime = execTime;

          while (qtyRemaining > 0 && openLongPositions.length > 0) {
            const position = openLongPositions[0];
            const qtyToClose = Math.min(position.quantity, qtyRemaining);
            qtyRemaining -= qtyToClose;

            if (qtyToClose < position.quantity) {
              position.quantity -= qtyToClose;
            } else {
              openLongPositions.shift();
            }

            const entryPrice = position.trade.netPrice;
            const exitPrice = sellPrice;
            const entryTime = parseDateTime(position.trade.execTime)!;
            const pnl = (exitPrice - entryPrice) * qtyToClose;
            const percentChange = (exitPrice / entryPrice - 1) * 100;
            const duration = (sellTime.getTime() - entryTime.getTime()) / 1000;

            analyzedTrades.push({
              symbol,
              direction: 'Long',
              quantity: qtyToClose,
              entryTime,
              exitTime: sellTime,
              duration,
              entryPrice,
              exitPrice,
              pnl,
              percentChange,
              orderType: position.trade.orderType,
              status: 'Closed'
            });
          }
        } else if (trade.side === 'BUY' && openShortPositions.length > 0) {
          // Closing short positions (FIFO)
          let qtyRemaining = quantity;
          const buyPrice = trade.netPrice;
          const buyTime = execTime;

          while (qtyRemaining > 0 && openShortPositions.length > 0) {
            const position = openShortPositions[0];
            const qtyToClose = Math.min(position.quantity, qtyRemaining);
            qtyRemaining -= qtyToClose;

            if (qtyToClose < position.quantity) {
              position.quantity -= qtyToClose;
            } else {
              openShortPositions.shift();
            }

            const entryPrice = position.trade.netPrice;
            const exitPrice = buyPrice;
            const entryTime = parseDateTime(position.trade.execTime)!;
            const pnl = (entryPrice - exitPrice) * qtyToClose; // Reversed for shorts
            const percentChange = (entryPrice / exitPrice - 1) * 100; // Reversed for shorts
            const duration = (buyTime.getTime() - entryTime.getTime()) / 1000;

            analyzedTrades.push({
              symbol,
              direction: 'Short',
              quantity: qtyToClose,
              entryTime,
              exitTime: buyTime,
              duration,
              entryPrice,
              exitPrice,
              pnl,
              percentChange,
              orderType: position.trade.orderType,
              status: 'Closed'
            });
          }
        }
      }
    }

    // Handle remaining open long positions
    for (const position of openLongPositions) {
      const entryTime = parseDateTime(position.trade.execTime)!;
      const fixedExitTime = new Date('2001-01-01T23:59:59');

      analyzedTrades.push({
        symbol,
        direction: 'Long',
        quantity: position.quantity,
        entryTime,
        exitTime: fixedExitTime,
        duration: 0,
        entryPrice: position.trade.netPrice,
        exitPrice: null,
        pnl: 0,
        percentChange: 0,
        orderType: position.trade.orderType,
        status: 'Open'
      });
    }

    // Handle remaining open short positions
    for (const position of openShortPositions) {
      const entryTime = parseDateTime(position.trade.execTime)!;
      const fixedExitTime = new Date('2001-01-01T23:59:59');

      analyzedTrades.push({
        symbol,
        direction: 'Short',
        quantity: position.quantity,
        entryTime,
        exitTime: fixedExitTime,
        duration: 0,
        entryPrice: position.trade.netPrice,
        exitPrice: null,
        pnl: 0,
        percentChange: 0,
        orderType: position.trade.orderType,
        status: 'Open'
      });
    }
  }

  return analyzedTrades;
}

function cleanTradeData(trades: RawTradeData[]): RawTradeData[] {
  return trades
    .map(trade => ({
      ...trade,
      side: trade.side.trim() as 'BUY' | 'SELL',
      posEffect: trade.posEffect.trim() as 'TO OPEN' | 'TO CLOSE',
      qty: trade.qty.toString().trim()
    }))
    .filter(trade => {
      const execTime = parseDateTime(trade.execTime);
      return execTime !== null;
    })
    .sort((a, b) => {
      const timeA = parseDateTime(a.execTime)!;
      const timeB = parseDateTime(b.execTime)!;
      return timeA.getTime() - timeB.getTime();
    });
}

function parseDateTime(dateTimeStr: string): Date | null {
  try {
    const [datePart, timePart] = dateTimeStr.split(' ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second = '0'] = timePart.split(':');
    
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
    
    return new Date(
      fullYear,
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  } catch (error) {
    console.error('Failed to parse datetime:', dateTimeStr, error);
    return null;
  }
}

function parseQuantity(qtyStr: string): number {
  return Math.abs(parseInt(qtyStr.replace(/[+-]/g, '')));
}

function convertToParseTradeFormat(analyzedTrades: AnalyzedTrade[]): ParsedTrade[] {
  return analyzedTrades.map(trade => ({
    symbol: trade.symbol,
    direction: trade.direction,
    quantity: trade.quantity,
    entryDate: trade.entryTime.toISOString().split('T')[0], // YYYY-MM-DD
    entryTime: trade.entryTime.toTimeString().split(' ')[0], // HH:MM:SS
    exitDate: trade.exitTime ? trade.exitTime.toISOString().split('T')[0] : trade.entryTime.toISOString().split('T')[0],
    exitTime: trade.exitTime ? trade.exitTime.toTimeString().split(' ')[0] : '23:59:59',
    duration: trade.duration,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice || trade.entryPrice,
    pnl: trade.pnl,
    percentChange: trade.percentChange,
    orderType: trade.orderType,
    status: trade.status
  }));
}

export default router;