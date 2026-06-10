import express from 'express';
import multer from 'multer';
import { TradeAnalyzer, RawTradeData } from '../utils/tradeAnalyzer';
import { CSVProcessor } from '../utils/csvProcessor';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Configure multer for in-memory file storage (CSV files are small text files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept CSV files only
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Process CSV file endpoint
router.post('/process', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'No file uploaded',
          details: ['Please select a CSV file to upload']
        }
      });
    }

    // Read CSV content from the in-memory buffer
    const csvContent = req.file.buffer.toString('utf-8');

    // Validate CSV format
    const validation = CSVProcessor.validateCSVFormat(csvContent);
    if (!validation.isValid) {
      return res.status(400).json({
        error: {
          message: validation.error,
          details: validation.missingColumns ? 
            [`Missing columns: ${validation.missingColumns.join(', ')}`] : 
            ['Please check your CSV file format']
        }
      });
    }

    // Extract and clean trade data
    const cleanedCSV = CSVProcessor.cleanCSVData(csvContent);
    
    // Parse CSV to raw trade data
    let rawTrades: RawTradeData[];
    try {
      rawTrades = TradeAnalyzer.parseCSV(cleanedCSV);
    } catch (error) {
      return res.status(400).json({
        error: {
          message: 'Failed to parse CSV data',
          details: [error instanceof Error ? error.message : 'Invalid CSV format']
        }
      });
    }

    if (rawTrades.length === 0) {
      return res.status(400).json({
        error: {
          message: 'No valid trades found in CSV',
          details: ['Please check that your CSV contains trade data']
        }
      });
    }

    // Detect duplicates
    const { duplicates, unique } = CSVProcessor.detectDuplicates(rawTrades);

    // Analyze trades using FIFO logic
    const { trades: analyzedTrades, summary } = TradeAnalyzer.analyzeTrades(unique);

    // Update summary with duplicate info
    const finalSummary = {
      ...summary,
      duplicatesRejected: duplicates.length
    };

    res.json({
      success: true,
      trades: analyzedTrades,
      summary: finalSummary
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        error: {
          message: error.code === 'LIMIT_FILE_SIZE' ? 'File too large' : 'Upload error',
          details: [error.message]
        }
      });
    }
    res.status(500).json({
      error: {
        message: 'Internal server error',
        details: ['Please try again or contact support']
      }
    });
  }
});

// Save trades to database endpoint
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { trades, brokerId = 1 } = req.body;
    const userId = req.user!.userId;

    if (!trades || !Array.isArray(trades)) {
      return res.status(400).json({
        error: {
          message: 'Invalid trade data',
          details: ['No trades provided for import']
        }
      });
    }

    // Verify broker exists
    const broker = await prisma.broker.findUnique({
      where: { id: brokerId }
    });

    if (!broker) {
      return res.status(400).json({
        error: {
          message: 'Invalid broker',
          details: ['Please select a valid broker account']
        }
      });
    }

    // Convert to database format (matches your Prisma schema exactly)
    const dbTrades = TradeAnalyzer.convertToDatabaseFormat(trades, brokerId, userId);

    // Check for existing trades to prevent duplicates (scoped to this user)
    const existingTrades = await prisma.trade.findMany({
      where: {
        userId,
        brokerId,
        symbol: { in: trades.map((t: any) => t.symbol) }
      },
      select: {
        symbol: true,
        entryDate: true,
        entryTime: true,
        quantity: true,
        entryPrice: true
      }
    });

    // Filter out duplicates based on symbol + entryDate + quantity + price
    const newTrades = dbTrades.filter(trade => {
      const isDuplicate = existingTrades.some(existing => 
        existing.symbol === trade.symbol &&
        Math.abs(existing.entryDate.getTime() - trade.entryDate.getTime()) < 60000 && // Within 1 minute
        existing.quantity === trade.quantity &&
        Math.abs(existing.entryPrice - trade.entryPrice) < 0.01
      );
      return !isDuplicate;
    });

    if (newTrades.length === 0) {
      return res.json({
        success: true,
        message: 'All trades already exist in database',
        imported: 0,
        duplicates: dbTrades.length
      });
    }

    // Save trades to database using transaction
    const result = await prisma.$transaction(async (tx) => {
      const savedTrades = [];
      
      for (const trade of newTrades) {
        try {
          const savedTrade = await tx.trade.create({
            data: trade,
            include: {
              broker: true
            }
          });
          savedTrades.push(savedTrade);
        } catch (error) {
          console.error(`Failed to save trade for ${trade.symbol}:`, error);
        }
      }
      
      return savedTrades;
    });

    res.json({
      success: true,
      message: `Successfully imported ${result.length} trades`,
      imported: result.length,
      duplicates: dbTrades.length - newTrades.length
    });

  } catch (error: any) {
    console.error('❌ Error saving trades:', error?.message || error);
    console.error('❌ Error stack:', error?.stack);
    if (error?.code) console.error('❌ Prisma error code:', error.code);
    if (error?.meta) console.error('❌ Prisma error meta:', JSON.stringify(error.meta));
    res.status(500).json({
      error: {
        message: 'Database error',
        details: [error?.message || 'Failed to save trades to database'],
        code: error?.code || null
      }
    });
  }
});

// Get available brokers for import (reuse your existing broker logic)
router.get('/brokers', authenticateToken, async (req, res) => {
  try {
    const brokers = await prisma.broker.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      brokers
    });

  } catch (error) {
    console.error('Error fetching brokers:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch brokers',
        details: ['Please try again later']
      }
    });
  }
});

export default router;