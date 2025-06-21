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

// ADD THESE INTERFACES after your imports:
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



// 🔥 ENHANCED: Get all trades with broker information
router.get('/', async (req, res) => {
  try {
    const { brokerId } = req.query;
    
    const whereClause = brokerId ? { brokerId: parseInt(brokerId as string) } : {};
    
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
      orderBy: { entryDate: 'desc' }
    });
    res.json(trades);
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

// 🔥 NEW: Get trades with filtering and search
/*router.get('/search', async (req, res) => {
  try {
    const { 
      symbol, 
      direction, 
      strategy, 
      dateFrom, 
      dateTo, 
      minPnL, 
      maxPnL,
      tags,
      brokerId 
    } = req.query;

    const where: any = {};

    if (symbol) {
      where.symbol = { contains: symbol as string, mode: 'insensitive' };
    }
    if (direction) {
      where.direction = direction;
    }
    if (strategy) {
      where.strategy = { contains: strategy as string, mode: 'insensitive' };
    }
    if (dateFrom) {
      where.entryDate = { gte: new Date(dateFrom as string) };
    }
    if (dateTo) {
      where.entryDate = { ...where.entryDate, lte: new Date(dateTo as string) };
    }
    if (minPnL) {
      where.pnl = { gte: parseFloat(minPnL as string) };
    }
    if (maxPnL) {
      where.pnl = { ...where.pnl, lte: parseFloat(maxPnL as string) };
    }
    if (tags) {
      where.tags = { contains: tags as string, mode: 'insensitive' };
    }
    if (brokerId) {
      where.brokerId = parseInt(brokerId as string);
    }

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
      orderBy: { entryDate: 'desc' }
    });

    res.json(trades);
  } catch (error) {
    console.error('Error searching trades:', error);
    res.status(500).json({ error: 'Failed to search trades' });
  }
}); */

// backend/src/routes/trades.ts - UPDATE the /search endpoint

// 🔥 UPDATED: Get trades with filtering and search
router.get('/search', async (req, res) => {
  try {
    const { 
      symbol, 
      direction, 
      strategy, 
      fromDate,           // 🔥 UPDATED: Single date filter
      tags,
      brokerId,
      status,             // 🔥 NEW: Status filter
      hasNotes,           // 🔥 NEW: Notes filter
      hasAssessment       // 🔥 NEW: Assessment filter
      
      // 🔥 REMOVED: Old filters we no longer use
      // dateFrom, 
      // dateTo, 
      // minPnL, 
      // maxPnL,
    } = req.query;

    const where: any = {};

    // Symbol filter (case-insensitive partial match)
    if (symbol) {
      where.symbol = { contains: symbol as string,  };
    }

    // Direction filter (exact match)
    if (direction) {
      where.direction = direction;
    }

    // Strategy filter (case-insensitive partial match)
    if (strategy) {
      where.strategy = { contains: strategy as string, };
    }

    // 🔥 UPDATED: Single date filter - show trades from this date forward
    if (fromDate) {
      where.entryDate = { gte: new Date(fromDate as string) };
    }

    // Tags filter (case-insensitive partial match)
    if (tags) {
      where.tags = { contains: tags as string, };
    }

    // Broker filter
    if (brokerId) {
      where.brokerId = parseInt(brokerId as string);
    }

    // 🔥 NEW: Status filter
    if (status) {
      where.status = status as string;
    }

    // 🔥 NEW: Has Notes filter
    // 🔥 NEW: Has Notes filter
if (hasNotes !== undefined) {
  const hasNotesBoolean = hasNotes === 'true';
  if (hasNotesBoolean) {
    // Show trades WITH notes (not null and not empty)
    where.AND = where.AND || [];
    where.AND.push({
      notes: { not: null }
    });
    where.AND.push({
      notes: { not: "" }
    });
  } else {
    // Show trades WITHOUT notes (null or empty)
    where.OR = [
      { notes: null },
      { notes: "" }
    ];
  }
}

    // 🔥 NEW: Has Assessment filter
    // 🔥 NEW: Has Assessment filter
if (hasAssessment !== undefined) {
  const hasAssessmentBoolean = hasAssessment === 'true';
  if (hasAssessmentBoolean) {
    // Show trades WITH assessment (not null and not empty)
    where.AND = where.AND || [];
    where.AND.push({
      assessment: { not: null }
    });
    where.AND.push({
      assessment: { not: "" }
    });
  } else {
    // Show trades WITHOUT assessment (null or empty)
    if (where.OR) {
      // Combine with existing OR condition
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
      orderBy: { entryDate: 'desc' }
    });

    console.log(`🔍 Found ${trades.length} trades matching filters`);
    res.json(trades);
    
  } catch (error) {
    console.error('Error searching trades:', error);
    res.status(500).json({ error: 'Failed to search trades' });
  }
});




// 🔥 ENHANCED: Get single trade with full details including broker
router.get('/:id', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    
    // Add validation for invalid ID
    if (isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }
    
    const trade = await prisma.trade.findUnique({
      where: {
        id: tradeId  // This was missing in your original code
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
      brokerId, // Required now
      // Journal fields
      notes,
      strategy,
      riskReward,
      commission,
      tags,
      // Additional metadata
      tradeId,
      executionVenue
    } = req.body;

    // Validate broker exists
    const broker = await prisma.broker.findUnique({
      where: { id: parseInt(brokerId) }
    });
    
    if (!broker) {
      return res.status(400).json({ error: 'Invalid broker ID' });
    }

    // Use broker's default commission if not provided
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
        // Journal fields
        notes: notes || null,
        strategy: strategy || null,
        riskReward: riskReward || null,
        commission: finalCommission ? parseFloat(finalCommission) : null,
        tags: tags || null,
        // Additional metadata
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

    // Extract ALL fields from request body
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

// -----

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

  // Basic calculations
  const totalTrades = trades.length;
  const totalPL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalCapital = trades.reduce((sum, trade) => sum + (trade.capital || 0), 0);
  const totalShares = trades.reduce((sum, trade) => sum + (trade.quantity || 0), 0);

  // Winning and losing trades
  const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
  const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
  const openTrades = trades.filter(trade => trade.status === 'Open').length;

  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  // Average win/loss
  const avgWin = winCount > 0 ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winCount : 0;
  const avgLoss = lossCount > 0 ? losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / lossCount : 0;

  // Highest gain/loss
  const highestGain = winCount > 0 ? Math.max(...winningTrades.map(trade => trade.pnl)) : 0;
  const highestLoss = lossCount > 0 ? Math.min(...losingTrades.map(trade => trade.pnl)) : 0;

  // Profit factor
  const grossProfits = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : (grossProfits > 0 ? 5.0 : 0);

  // Capital metrics
  const returnOnCapital = totalCapital > 0 ? (totalPL / totalCapital) * 100 : 0;
  const avgCapitalPerTrade = totalTrades > 0 ? totalCapital / totalTrades : 0;

  // Losing streak analysis
  const losingStreaks = calculateLosingStreaks(trades);

  // P&L time series (cumulative)
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
    profitFactor: Math.min(profitFactor, 5.0), // Cap at 5.0 for display
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
    .filter(trade => trade.status === 'Closed'); // Only count closed trades

  const streaks = [];
  let currentStreak = [];

  for (const trade of sortedTrades) {
    if ((trade.pnl || 0) < 0) {
      currentStreak.push(trade);
    } else {
      if (currentStreak.length >= 3) { // Only count streaks of 3+ losses
        streaks.push([...currentStreak]);
      }
      currentStreak = [];
    }
  }

  // Don't forget the last streak
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

// GET /api/analytics/summary - Overall analytics for all trades
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

// GET /api/analytics/daily/:date - Analytics for a specific day
router.get('/analytics/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    // Get trades for the specific day
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

// GET /api/analytics/weekly/:date - Analytics for the week containing the date
router.get('/analytics/weekly/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    // Get Monday of the week containing the target date
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get Sunday of the same week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
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

// GET /api/analytics/monthly/:date - Analytics for the month containing the date
router.get('/analytics/monthly/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    // First day of the month
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    
    // Last day of the month
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

// GET /api/analytics/ytd/:year - Year-to-date analytics
router.get('/analytics/ytd/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const targetYear = parseInt(year);
    
    // January 1st of the target year
    const startOfYear = new Date(targetYear, 0, 1);
    
    // Current date or end of year if it's a past year
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

// GET /api/analytics/previous-year/:year - Full year analytics
router.get('/analytics/previous-year/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const targetYear = parseInt(year);
    
    // January 1st of the target year
    const startOfYear = new Date(targetYear, 0, 1);
    
    // December 31st of the target year
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

    // Convert buffer to string
    const csvContent = req.file.buffer.toString('utf-8');
    
    // TODO: Parse CSV content (we'll implement this in Step 3)
    const parsedTrades = await parseCSVContent(csvContent);
    
    if (parsedTrades.length === 0) {
      return res.status(400).json({
        error: {
          message: 'No trades found in CSV file',
          details: ['Please check the file format and try again']
        }
      });
    }

    // 🔥 Detect duplicates against database
    const brokerId = 1; // You might get this from request body
    const duplicateResult = await duplicateDetection.detectDuplicatesBatch(parsedTrades, brokerId);

    // Create summary with accurate duplicate count
    const summary: ImportSummary = {
      totalImported: duplicateResult.uniqueTrades.length,
      duplicatesRejected: duplicateResult.duplicateCount,
      longTrades: duplicateResult.uniqueTrades.filter(t => t.direction === 'Long').length,
      shortTrades: duplicateResult.uniqueTrades.filter(t => t.direction === 'Short').length,
      openLongs: duplicateResult.uniqueTrades.filter(t => t.direction === 'Long' && t.status === 'Open').length,
      openShorts: duplicateResult.uniqueTrades.filter(t => t.direction === 'Short' && t.status === 'Open').length,
    };

    // Return only unique trades for preview
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

    // 🔥 Double-check for duplicates before saving (safety net)
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

    // Convert ParsedTrade[] to database format
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
      // Add default values for new schema fields
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

    // Save to database
    const result = await prisma.trade.createMany({
      data: tradesForDB,
      
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

// REPLACE your placeholder parseCSVContent function in trades.ts with this implementation:

async function parseCSVContent(csvContent: string): Promise<ParsedTrade[]> {
  console.log('🔍 Starting CSV parsing...');
  
  try {
    // Step 1: Extract the trade history section
    const tradeHistoryContent = extractTradeHistorySection(csvContent);
    
    if (!tradeHistoryContent) {
      console.log('❌ No "Account Trade History" section found');
      return [];
    }
    
    // Step 2: Parse the extracted content
    const trades = parseTradeHistoryContent(tradeHistoryContent);
    
    console.log(`✅ Successfully parsed ${trades.length} trades`);
    return trades;
    
  } catch (error) {
    console.error('❌ CSV parsing error:', error);
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to extract trade history section from CSV
function extractTradeHistorySection(csvContent: string): string | null {
  const lines = csvContent.split('\n');
  let foundTradeHistory = false;
  let nextIsHeader = false;
  const extractedLines: string[] = [];

  for (const line of lines) {
    // Check if this line contains "Account Trade History"
    if (line.toLowerCase().includes('account trade history')) {
      console.log('🔍 Found "Account Trade History" section');
      foundTradeHistory = true;
      nextIsHeader = true;
      continue;
    }

    // If we found the trade history section
    if (nextIsHeader) {
      extractedLines.push(line);
      nextIsHeader = false;
      continue;
    }

    // Continue collecting rows until we hit an empty line
    if (foundTradeHistory) {
      // Check if line is empty or contains only whitespace/commas
      if (line.trim() === '' || line.replace(/,/g, '').trim() === '') {
        break;
      }
      extractedLines.push(line);
    }
  }

  return extractedLines.length > 0 ? extractedLines.join('\n') : null;
}

// Helper function to parse the trade history content
function parseTradeHistoryContent(content: string): ParsedTrade[] {
  const lines = content.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('No trade data found - need at least header and one data row');
  }

  // Parse header to find column indices
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  
  console.log('📋 Found headers:', headers);

  // Map column names to indices
  const columnMap = {
    execTime: findColumnIndex(headers, ['exec time', 'time', 'execution time']),
    symbol: findColumnIndex(headers, ['symbol', 'instrument']),
    side: findColumnIndex(headers, ['side', 'buy/sell', 'direction']),
    qty: findColumnIndex(headers, ['qty', 'quantity', 'shares']),
    price: findColumnIndex(headers, ['price', 'exec price', 'execution price']),
    netPrice: findColumnIndex(headers, ['net price', 'net', 'total']),
    orderType: findColumnIndex(headers, ['order type', 'type']),
    posEffect: findColumnIndex(headers, ['pos effect', 'position effect', 'effect'])
  };

  // Validate required columns
  const requiredColumns = ['execTime', 'symbol', 'side', 'qty', 'price'];
  const missingColumns = requiredColumns.filter(col => columnMap[col as keyof typeof columnMap] === -1);
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  console.log('📊 Column mapping:', columnMap);

  // Parse data rows
  const trades: ParsedTrade[] = [];
  const dataLines = lines.slice(1); // Skip header

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    try {
      const trade = parseTradeRow(line, columnMap, i + 2); // +2 for header and 1-based indexing
      if (trade) {
        trades.push(trade);
      }
    } catch (error) {
      console.warn(`⚠️ Skipping row ${i + 2}: ${error}`);
    }
  }

  return trades;
}

// Helper function to find column index by multiple possible names
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(header => header.includes(name.toLowerCase()));
    if (index !== -1) return index;
  }
  return -1;
}

// Helper function to parse a single trade row
function parseTradeRow(line: string, columnMap: any, lineNumber: number): ParsedTrade | null {
  const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
  
  // Extract values using column mapping
  const execTime = columns[columnMap.execTime] || '';
  const symbol = columns[columnMap.symbol] || '';
  const side = columns[columnMap.side] || '';
  const qtyStr = columns[columnMap.qty] || '';
  const priceStr = columns[columnMap.price] || '';
  const netPriceStr = columns[columnMap.netPrice] || priceStr; // Fallback to price if no net price
  const orderType = columns[columnMap.orderType] || 'Market';
  const posEffect = columns[columnMap.posEffect] || '';

  // Validate required fields
  if (!symbol || !side || !qtyStr || !priceStr) {
    throw new Error(`Missing required fields - Symbol: ${symbol}, Side: ${side}, Qty: ${qtyStr}, Price: ${priceStr}`);
  }

  // Skip options trades (have strike prices)
  if (symbol.includes(' ') && (symbol.includes('C') || symbol.includes('P'))) {
    console.log(`⚠️ Skipping options trade: ${symbol}`);
    return null;
  }

  // Parse numeric values
  const quantity = parseInt(qtyStr.replace(/,/g, ''));
  const price = parseFloat(priceStr.replace(/[$,]/g, ''));
  const netPrice = parseFloat(netPriceStr.replace(/[$,]/g, ''));

  if (isNaN(quantity) || isNaN(price)) {
    throw new Error(`Invalid numeric values - Qty: ${qtyStr}, Price: ${priceStr}`);
  }

  // Determine direction based on side and position effect
  let direction: 'Long' | 'Short';
  const normalizedSide = side.toUpperCase();
  const normalizedPosEffect = posEffect.toUpperCase();

  if (normalizedSide === 'BUY' || normalizedSide === 'B') {
    direction = 'Long';
  } else if (normalizedSide === 'SELL' || normalizedSide === 'S') {
    // Check if this is closing a long position or opening a short
    if (normalizedPosEffect.includes('CLOSE')) {
      direction = 'Long'; // Closing long position
    } else {
      direction = 'Short'; // Opening short position
    }
  } else {
    throw new Error(`Unsupported side: ${side}`);
  }

  // Parse date and time from execTime
  const { entryDate, entryTime } = parseDateTime(execTime);

  // For now, we'll set exit date/time same as entry (you may need to match trades later)
  const exitDate = entryDate;
  const exitTime = entryTime;

  // Calculate basic trade metrics (simplified for now)
  const entryPrice = price;
  const exitPrice = price; // Will be updated when matching closing trades
  const pnl = 0; // Will be calculated when matching trades
  const percentChange = 0; // Will be calculated when matching trades
  
  // Determine status
  const status: 'Open' | 'Closed' = normalizedPosEffect.includes('CLOSE') ? 'Closed' : 'Open';

  return {
    symbol: symbol.toUpperCase(),
    direction,
    quantity,
    entryDate,
    entryTime,
    entryPrice,
    exitDate,
    exitTime,
    exitPrice,
    duration: 0, // Will be calculated when matching trades
    pnl,
    percentChange,
    orderType,
    status
  };
}

// Helper function to parse date/time
function parseDateTime(execTime: string): { entryDate: string, entryTime: string } {
  // Handle different date/time formats
  // Example formats: "12/01/24 09:30:00", "2024-12-01 09:30:00", etc.
  
  const cleanTime = execTime.trim();
  
  if (cleanTime.includes(' ')) {
    const [datePart, timePart] = cleanTime.split(' ');
    
    // Convert date to YYYY-MM-DD format
    let formattedDate: string;
    if (datePart.includes('/')) {
      // Handle MM/DD/YY or MM/DD/YYYY format
      const [month, day, year] = datePart.split('/');
      const fullYear = year.length === 2 ? `20${year}` : year;
      formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else {
      // Assume already in YYYY-MM-DD format
      formattedDate = datePart;
    }
    
    // Format time to HH:MM:SS
    let formattedTime = timePart;
    if (timePart.match(/^\d{1,2}:\d{2}$/)) {
      formattedTime = `${timePart}:00`; // Add seconds if missing
    }
    
    return {
      entryDate: formattedDate,
      entryTime: formattedTime
    };
  }
  
  // Fallback for malformed date/time
  const now = new Date();
  return {
    entryDate: now.toISOString().split('T')[0],
    entryTime: now.toTimeString().split(' ')[0]
  };
}



export default router;