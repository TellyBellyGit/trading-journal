// utils/tradeAnalyzer.ts

export interface RawTradeData {
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: string; // e.g., "+1", "-2"
  posEffect: 'TO OPEN' | 'TO CLOSE';
  netPrice: number;
  execTime: string; // MM/DD/YY HH:MM:SS
  orderType: string;
}

export interface AnalyzedTrade {
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

export interface ImportSummary {
  totalImported: number;
  duplicatesRejected: number;
  longTrades: number;
  shortTrades: number;
  openLongs: number;
  openShorts: number;
}

interface OpenPosition {
  quantity: number;
  trade: RawTradeData;
}

export class TradeAnalyzer {
  private static parseDateTime(dateTimeStr: string): Date | null {
    try {
      // Try MM/DD/YY HH:MM:SS format
      const [datePart, timePart] = dateTimeStr.split(' ');
      const [month, day, year] = datePart.split('/');
      const [hour, minute, second = '0'] = timePart.split(':');
      
      // Convert 2-digit year to 4-digit (assuming 20xx)
      const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
      
      return new Date(
        fullYear,
        parseInt(month) - 1, // Month is 0-indexed
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

  private static parseQuantity(qtyStr: string): number {
    // Remove + and - signs, convert to number
    return Math.abs(parseInt(qtyStr.replace(/[+-]/g, '')));
  }

  private static cleanTradeData(trades: RawTradeData[]): RawTradeData[] {
    return trades
      .map(trade => ({
        ...trade,
        side: trade.side.trim() as 'BUY' | 'SELL',
        posEffect: trade.posEffect.trim() as 'TO OPEN' | 'TO CLOSE',
        qty: trade.qty.toString().trim()
      }))
      .filter(trade => {
        const execTime = this.parseDateTime(trade.execTime);
        return execTime !== null;
      })
      .sort((a, b) => {
        const timeA = this.parseDateTime(a.execTime)!;
        const timeB = this.parseDateTime(b.execTime)!;
        return timeA.getTime() - timeB.getTime();
      });
  }

  public static analyzeTrades(rawTrades: RawTradeData[]): {
    trades: AnalyzedTrade[];
    summary: ImportSummary;
  } {
    const cleanTrades = this.cleanTradeData(rawTrades);
    const symbols = [...new Set(cleanTrades.map(t => t.symbol))];
    const analyzedTrades: AnalyzedTrade[] = [];

    let totalLongs = 0;
    let totalShorts = 0;
    let openLongs = 0;
    let openShorts = 0;

    for (const symbol of symbols) {
      const symbolTrades = cleanTrades.filter(t => t.symbol === symbol);
      const openLongPositions: OpenPosition[] = [];
      const openShortPositions: OpenPosition[] = [];

      for (const trade of symbolTrades) {
        const quantity = this.parseQuantity(trade.qty);
        const execTime = this.parseDateTime(trade.execTime)!;

        if (trade.posEffect === 'TO OPEN') {
          if (trade.side === 'BUY') {
            // Opening long position
            openLongPositions.push({ quantity, trade });
          } else if (trade.side === 'SELL') {
            // Opening short position
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

              // Calculate trade metrics for LONG
              const entryPrice = position.trade.netPrice;
              const exitPrice = sellPrice;
              const entryTime = this.parseDateTime(position.trade.execTime)!;
              const pnl = (exitPrice - entryPrice) * qtyToClose;
              const percentChange = (exitPrice / entryPrice - 1) * 100;
              const duration = (sellTime.getTime() - entryTime.getTime()) / (1000 * 60); // minutes

              analyzedTrades.push({
                symbol,
                direction: 'Long',
                quantity: qtyToClose,
                entryTime,
                exitTime: sellTime,
                duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
                entryPrice,
                exitPrice,
                pnl: Math.round(pnl * 100) / 100, // Round to 2 decimal places
                percentChange: Math.round(percentChange * 100) / 100, // Round to 2 decimal places
                orderType: position.trade.orderType,
                status: 'Closed'
              });

              totalLongs++;
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

              // Calculate trade metrics for SHORT
              const entryPrice = position.trade.netPrice;
              const exitPrice = buyPrice;
              const entryTime = this.parseDateTime(position.trade.execTime)!;
              const pnl = (entryPrice - exitPrice) * qtyToClose; // Reversed for shorts
              const percentChange = (entryPrice / exitPrice - 1) * 100; // Reversed for shorts
              const duration = (buyTime.getTime() - entryTime.getTime()) / (1000 * 60); // minutes

              analyzedTrades.push({
                symbol,
                direction: 'Short',
                quantity: qtyToClose,
                entryTime,
                exitTime: buyTime,
                duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
                entryPrice,
                exitPrice,
                pnl: Math.round(pnl * 100) / 100, // Round to 2 decimal places
                percentChange: Math.round(percentChange * 100) / 100, // Round to 2 decimal places
                orderType: position.trade.orderType,
                status: 'Closed'
              });

              totalShorts++;
            }
          }
        }
      }

      // Handle remaining open long positions
      for (const position of openLongPositions) {
        const entryTime = this.parseDateTime(position.trade.execTime)!;
        // Use fixed placeholder date for open positions
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

        openLongs++;
      }

      // Handle remaining open short positions
      for (const position of openShortPositions) {
        const entryTime = this.parseDateTime(position.trade.execTime)!;
        // Use fixed placeholder date for open positions
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

        openShorts++;
      }
    }

    const summary: ImportSummary = {
      totalImported: analyzedTrades.length,
      duplicatesRejected: 0, // TODO: Implement duplicate detection
      longTrades: totalLongs,
      shortTrades: totalShorts,
      openLongs,
      openShorts
    };

    return { trades: analyzedTrades, summary };
  }

  // Convert to database format
  public static convertToDatabaseFormat(
    analyzedTrades: AnalyzedTrade[],
    brokerId: number
  ): any[] {
    return analyzedTrades.map(trade => {
      // Ensure entryTime is a Date object
      const entryDate = trade.entryTime instanceof Date ? trade.entryTime : new Date(trade.entryTime);
      const exitDate = trade.exitTime instanceof Date ? trade.exitTime : 
                      (trade.exitTime ? new Date(trade.exitTime) : new Date('2001-01-01'));

      return {
        symbol: trade.symbol,
        direction: trade.direction,
        quantity: trade.quantity,
        entryDate: entryDate,
        entryTime: entryDate.toTimeString().split(' ')[0], // HH:MM:SS format
        entryPrice: trade.entryPrice,
        exitDate: exitDate,
        exitTime: trade.exitTime ? exitDate.toTimeString().split(' ')[0] : '23:59:59',
        exitPrice: trade.exitPrice || 0,
        duration: trade.duration.toString(),
        pnl: trade.pnl,
        percentChange: trade.percentChange,
        orderType: trade.orderType,
        assessment: null,
        capital: trade.entryPrice * trade.quantity, // Calculate capital deployed
        brokerId,
        notes: null,
        strategy: null,
        riskReward: null,
        commission: null,
        tags: null,
        tradeId: null,
        executionVenue: null
      };
    });
  }

  // Parse CSV content
  public static parseCSV(csvContent: string): RawTradeData[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Find required column indices
    const symbolIndex = headers.findIndex(h => h.toLowerCase().includes('symbol'));
    const sideIndex = headers.findIndex(h => h.toLowerCase().includes('side'));
    const qtyIndex = headers.findIndex(h => h.toLowerCase().includes('qty'));
    const posEffectIndex = headers.findIndex(h => h.toLowerCase().includes('pos effect'));
    const netPriceIndex = headers.findIndex(h => h.toLowerCase().includes('net price'));
    const execTimeIndex = headers.findIndex(h => h.toLowerCase().includes('exec time'));
    const orderTypeIndex = headers.findIndex(h => h.toLowerCase().includes('order type'));

    if (symbolIndex === -1 || sideIndex === -1 || qtyIndex === -1 || 
        posEffectIndex === -1 || netPriceIndex === -1 || execTimeIndex === -1) {
      throw new Error('Missing required columns in CSV file');
    }

    const trades: RawTradeData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map(c => c.trim());
      
      if (cells.length < headers.length) continue; // Skip incomplete rows

      try {
        trades.push({
          symbol: cells[symbolIndex],
          side: cells[sideIndex] as 'BUY' | 'SELL',
          qty: cells[qtyIndex],
          posEffect: cells[posEffectIndex] as 'TO OPEN' | 'TO CLOSE',
          netPrice: parseFloat(cells[netPriceIndex]),
          execTime: cells[execTimeIndex],
          orderType: orderTypeIndex !== -1 ? cells[orderTypeIndex] : 'UNKNOWN'
        });
      } catch (error) {
        console.warn(`Skipping invalid row ${i + 1}:`, error);
      }
    }

    return trades;
  }
}