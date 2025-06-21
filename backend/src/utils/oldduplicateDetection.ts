// utils/duplicateDetection.ts
import { PrismaClient } from '@prisma/client';

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

interface DuplicateDetectionResult {
  uniqueTrades: ParsedTrade[];
  duplicateTrades: ParsedTrade[];
  duplicateCount: number;
  duplicateDetails: {
    symbol: string;
    entryDate: string;
    entryTime: string;
    reason: string;
  }[];
}

export class DuplicateDetection {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Detect duplicates by comparing parsed trades against existing database records
   * @param parsedTrades - Array of trades parsed from CSV
   * @param brokerId - ID of the broker account
   * @returns Object containing unique trades, duplicates, and details
   */
  async detectDuplicates(
    parsedTrades: ParsedTrade[], 
    brokerId: number
  ): Promise<DuplicateDetectionResult> {
    const uniqueTrades: ParsedTrade[] = [];
    const duplicateTrades: ParsedTrade[] = [];
    const duplicateDetails: { symbol: string; entryDate: string; entryTime: string; reason: string; }[] = [];

    for (const trade of parsedTrades) {
      // Convert entryDate string to Date object for database query
      const entryDate = new Date(trade.entryDate);
      
      // Query database for existing trade with matching criteria
      const existingTrade = await this.prisma.trade.findFirst({
        where: {
          symbol: trade.symbol,
          entryDate: entryDate,
          entryTime: trade.entryTime,
          direction: trade.direction,
          quantity: trade.quantity,
          entryPrice: trade.entryPrice,
          brokerId: brokerId
        }
      });

      if (existingTrade) {
        // This is a duplicate
        duplicateTrades.push(trade);
        duplicateDetails.push({
          symbol: trade.symbol,
          entryDate: trade.entryDate,
          entryTime: trade.entryTime,
          reason: `Duplicate found: Trade already exists with ID ${existingTrade.id}`
        });
      } else {
        // This is a unique trade
        uniqueTrades.push(trade);
      }
    }

    return {
      uniqueTrades,
      duplicateTrades,
      duplicateCount: duplicateTrades.length,
      duplicateDetails
    };
  }

  /**
   * Create a unique identifier for a trade (for logging/debugging)
   */
  private createTradeKey(trade: ParsedTrade): string {
    return `${trade.symbol}-${trade.entryDate}-${trade.entryTime}-${trade.direction}-${trade.quantity}-${trade.entryPrice}`;
  }

  /**
   * Batch query optimization: Get all potentially duplicate trades in one query
   * This is more efficient for large CSV files
   */
  async detectDuplicatesBatch(
    parsedTrades: ParsedTrade[], 
    brokerId: number
  ): Promise<DuplicateDetectionResult> {
    // Create array of unique dates to query
    const entryDates = [...new Set(parsedTrades.map(trade => new Date(trade.entryDate)))];
    
    // Get all existing trades for these dates in one query
    const existingTrades = await this.prisma.trade.findMany({
      where: {
        brokerId: brokerId,
        entryDate: {
          in: entryDates
        }
      },
      select: {
        id: true,
        symbol: true,
        entryDate: true,
        entryTime: true,
        direction: true,
        quantity: true,
        entryPrice: true
      }
    });

    // Create a Map for fast lookup
    const existingTradesMap = new Map<string, any>();
    existingTrades.forEach(trade => {
      const key = `${trade.symbol}-${trade.entryDate.toISOString().split('T')[0]}-${trade.entryTime}-${trade.direction}-${trade.quantity}-${trade.entryPrice}`;
      existingTradesMap.set(key, trade);
    });

    const uniqueTrades: ParsedTrade[] = [];
    const duplicateTrades: ParsedTrade[] = [];
    const duplicateDetails: { symbol: string; entryDate: string; entryTime: string; reason: string; }[] = [];

    for (const trade of parsedTrades) {
      const tradeKey = `${trade.symbol}-${trade.entryDate}-${trade.entryTime}-${trade.direction}-${trade.quantity}-${trade.entryPrice}`;
      const existingTrade = existingTradesMap.get(tradeKey);

      if (existingTrade) {
        duplicateTrades.push(trade);
        duplicateDetails.push({
          symbol: trade.symbol,
          entryDate: trade.entryDate,
          entryTime: trade.entryTime,
          reason: `Duplicate found: Trade already exists with ID ${existingTrade.id}`
        });
      } else {
        uniqueTrades.push(trade);
      }
    }

    return {
      uniqueTrades,
      duplicateTrades,
      duplicateCount: duplicateTrades.length,
      duplicateDetails
    };
  }
}