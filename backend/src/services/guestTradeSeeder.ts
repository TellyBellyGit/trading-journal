// Hardcoded sample trade templates for guest users
// These give new guests some data to explore instead of seeing a blank app

import { prisma } from '../lib/prisma';

interface TradeTemplate {
  symbol: string;
  direction: string;
  quantity: number;
  entryDate: Date;
  entryTime: string;
  entryPrice: number;
  exitDate: Date;
  exitTime: string;
  exitPrice: number;
  duration: string;
  pnl: number;
  percentChange: number;
  orderType: string;
  assessment: string;
  capital: number;
  status: string;
  notes: string | null;
  strategy: string | null;
  riskReward: string | null;
  commission: number | null;
  tags: string | null;
  tradeId: string | null;
  executionVenue: string | null;
}

// Original trade dates from seed data - we'll offset to make them recent
const BASE_DATE = new Date();

const tradeTemplates: TradeTemplate[] = [
  {
    symbol: "SBUX",
    direction: "Short",
    quantity: 1,
    entryDate: new Date("2026-03-21"),
    entryTime: "17:08:02",
    entryPrice: 104.47,
    exitDate: new Date("2026-03-21"),
    exitTime: "17:32:02",
    exitPrice: 104.27,
    duration: "1440",
    pnl: 0.2,
    percentChange: 0.19,
    orderType: "STOCK",
    assessment: "Short momentum trade - small profit",
    capital: 104.47,
    status: "Closed",
    notes: "<p>Quick scalp on SBUX after breakdown below VWAP. Took profits early - could have held longer for bigger move.</p>",
    strategy: "Momentum",
    riskReward: "1:2",
    commission: 0.0,
    tags: "scalp,momentum",
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "AAPL",
    direction: "Long",
    quantity: 10,
    entryDate: new Date("2026-03-20"),
    entryTime: "10:15:30",
    entryPrice: 198.50,
    exitDate: new Date("2026-03-20"),
    exitTime: "11:45:00",
    exitPrice: 202.30,
    duration: "5370",
    pnl: 38.0,
    percentChange: 1.91,
    orderType: "STOCK",
    assessment: "Good entry at support, exit near resistance",
    capital: 1985.0,
    status: "Closed",
    notes: "<p>Entered on bounce off 50-day SMA. Held through midday consolidation. Exited just below resistance at $203.</p>",
    strategy: "Support/Resistance",
    riskReward: "1:2.5",
    commission: 0.0,
    tags: "support,resistance,swing",
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "TSLA",
    direction: "Long",
    quantity: 5,
    entryDate: new Date("2026-03-19"),
    entryTime: "14:30:00",
    entryPrice: 248.75,
    exitDate: new Date("2026-03-19"),
    exitTime: "15:55:00",
    exitPrice: 244.10,
    duration: "5100",
    pnl: -23.25,
    percentChange: -1.87,
    orderType: "STOCK",
    assessment: "Bought the dip but it kept dipping - cut loss",
    capital: 1243.75,
    status: "Closed",
    notes: "<p>Thought support at $248 would hold. It didn't. Honored stop loss. Good discipline but wrong direction call.</p>",
    strategy: "Dip Buy",
    riskReward: "1:3",
    commission: 0.0,
    tags: "loss,dip,discipline",
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "NVDA",
    direction: "Long",
    quantity: 2,
    entryDate: new Date("2026-03-18"),
    entryTime: "09:45:00",
    entryPrice: 892.00,
    exitDate: new Date("2026-03-18"),
    exitTime: "16:00:00",
    exitPrice: 910.50,
    duration: "22500",
    pnl: 37.0,
    percentChange: 2.07,
    orderType: "STOCK",
    assessment: "Held all day for gap fill play",
    capital: 1784.0,
    status: "Closed",
    notes: "<p>NVDA gapped up pre-market. Entered on pullback to VWAP. Held through afternoon push. Exited at close.</p>",
    strategy: "Gap Fill",
    riskReward: "1:2",
    commission: 0.0,
    tags: "gap,VWAP,semiconductor",
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "AMD",
    direction: "Short",
    quantity: 10,
    entryDate: new Date("2026-03-17"),
    entryTime: "11:00:00",
    entryPrice: 172.40,
    exitDate: new Date("2026-03-17"),
    exitTime: "13:20:00",
    exitPrice: 168.90,
    duration: "8400",
    pnl: 35.0,
    percentChange: 2.03,
    orderType: "STOCK",
    assessment: "Short at resistance - good exit before bounce",
    capital: 1724.0,
    status: "Closed",
    notes: "<p>AMD rejected at $173 resistance for third time this week. Shorted with tight stop. Covered before it bounced.</p>",
    strategy: "Resistance Short",
    riskReward: "1:1.5",
    commission: 0.0,
    tags: "resistance,short,semiconductor",
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "MSFT",
    direction: "Long",
    quantity: 3,
    entryDate: new Date("2026-03-14"),
    entryTime: "10:30:00",
    entryPrice: 425.00,
    exitDate: new Date("2026-03-14"),
    exitTime: "14:00:00",
    exitPrice: 430.80,
    duration: "12600",
    pnl: 17.4,
    percentChange: 1.36,
    orderType: "STOCK",
    assessment: "Steady uptrend - held for multi-hour move",
    capital: 1275.0,
    status: "Closed",
    notes: "<p>MSFT slowly grinding up on volume. Entered on pullback to 20 EMA. Patient hold paid off.</p>",
    strategy: "Trend Following",
    riskReward: "1:2",
    commission: 0.0,
    tags: "trend,volume,EMA",
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "META",
    direction: "Long",
    quantity: 2,
    entryDate: new Date("2026-03-13"),
    entryTime: "09:35:00",
    entryPrice: 510.20,
    exitDate: new Date("2026-03-13"),
    exitTime: "15:45:00",
    exitPrice: 525.75,
    duration: "22200",
    pnl: 31.1,
    percentChange: 3.05,
    orderType: "STOCK",
    assessment: "Strong earnings momentum continued",
    capital: 1020.4,
    status: "Closed",
    notes: "<p>META riding post-earnings momentum. Entered early, held all day. Nice gain.</p>",
    strategy: "Momentum",
    riskReward: "1:3",
    commission: 0.0,
    tags: "earnings,momentum,swing",
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "GNPX",
    direction: "Long",
    quantity: 10,
    entryDate: new Date("2026-03-12"),
    entryTime: "14:56:49",
    entryPrice: 0.645,
    exitDate: new Date("2026-03-12"),
    exitTime: "14:59:32",
    exitPrice: 0.663,
    duration: "163",
    pnl: 0.18,
    percentChange: 2.79,
    orderType: "STOCK",
    assessment: "Exited before TP $0.66",
    capital: 6.45,
    status: "Closed",
    notes: "<p>First trade - would have made TP if I had stayed in.</p>",
    strategy: null,
    riskReward: null,
    commission: null,
    tags: null,
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "RXRX",
    direction: "Long",
    quantity: 10,
    entryDate: new Date("2026-03-11"),
    entryTime: "14:50:52",
    entryPrice: 6.33,
    exitDate: new Date("2026-03-11"),
    exitTime: "14:52:23",
    exitPrice: 6.46,
    duration: "91",
    pnl: 1.30,
    percentChange: 2.05,
    orderType: "STOCK",
    assessment: "Exited before TP $6.46",
    capital: 63.30,
    status: "Closed",
    notes: "<p>Bought at the right place but came out where I should have added</p>",
    strategy: null,
    riskReward: null,
    commission: null,
    tags: null,
    tradeId: null,
    executionVenue: null
  },
  {
    symbol: "RXRX",
    direction: "Long",
    quantity: 10,
    entryDate: new Date("2026-03-10"),
    entryTime: "14:48:07",
    entryPrice: 6.40,
    exitDate: new Date("2026-03-10"),
    exitTime: "14:50:12",
    exitPrice: 6.30,
    duration: "125",
    pnl: -1.00,
    percentChange: -1.56,
    orderType: "STOCK",
    assessment: "Exit before SL $6.30",
    capital: 64.00,
    status: "Closed",
    notes: "<p>Bought at the top - then sold where I should have bought. Classic mistake.</p>",
    strategy: null,
    riskReward: null,
    commission: null,
    tags: null,
    tradeId: null,
    executionVenue: null
  }
];

export async function seedGuestTrades(userId: number) {
  // Find an active broker to assign trades to (use the first one available)
  const broker = await prisma.broker.findFirst({ where: { isActive: true } });

  if (!broker) {
    console.log('⚠️ No active broker found for guest trade seeding');
    return;
  }

  const createdTrades = [];

  for (const template of tradeTemplates) {
    const trade = await prisma.trade.create({
      data: {
        symbol: template.symbol,
        direction: template.direction,
        quantity: template.quantity,
        entryDate: template.entryDate,
        entryTime: template.entryTime,
        entryPrice: template.entryPrice,
        exitDate: template.exitDate,
        exitTime: template.exitTime,
        exitPrice: template.exitPrice,
        duration: template.duration,
        pnl: template.pnl,
        percentChange: template.percentChange,
        orderType: template.orderType,
        assessment: template.assessment,
        capital: template.capital,
        status: template.status,
        userId: userId,
        brokerId: broker.id,
        notes: template.notes,
        strategy: template.strategy,
        riskReward: template.riskReward,
        commission: template.commission,
        tags: template.tags,
        tradeId: template.tradeId,
        executionVenue: template.executionVenue,
      }
    });
    createdTrades.push(trade);
  }

  console.log(`✅ Seeded ${createdTrades.length} sample trades for user ${userId}`);

  return createdTrades;
}