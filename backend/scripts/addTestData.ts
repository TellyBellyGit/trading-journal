// backend/scripts/addTestData.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testTrades = [
  {
    symbol: 'AAPL',
    direction: 'Long',
    quantity: 100,
    entryDate: new Date('2025-01-15'),
    entryTime: '09:30',
    entryPrice: 175.50,
    exitDate: new Date('2025-01-20'),
    exitTime: '15:45',
    exitPrice: 182.30,
    duration: '5 days',
    pnl: 680.00,
    percentChange: 3.87,
    orderType: 'Market',
    assessment: 'Good breakout trade',
    capital: 17550.00,
    brokerId: 1,
    strategy: 'Breakout',
    riskReward: '1:3',
    commission: 2.50,
    notes: '<p>Strong breakout above resistance at $175. Volume confirmed the move.</p><p><strong>Entry reasoning:</strong> Clean break of daily resistance with high volume</p>',
    tags: 'breakout,momentum'
  },
  {
    symbol: 'TSLA',
    direction: 'Short',
    quantity: 50,
    entryDate: new Date('2025-01-18'),
    entryTime: '10:15',
    entryPrice: 250.00,
    exitDate: new Date('2025-01-22'),
    exitTime: '14:20',
    exitPrice: 245.50,
    duration: '4 days',
    pnl: 225.00,
    percentChange: 1.8,
    orderType: 'Limit',
    assessment: 'Successful short',
    capital: 12500.00,
    brokerId: 2,
    strategy: 'Mean Reversion',
    riskReward: '1:2',
    commission: 1.75,
    notes: '<p>Overextended move, RSI showing divergence</p>',
    tags: 'short,mean-reversion'
  },
  {
    symbol: 'MSFT',
    direction: 'Long',
    quantity: 75,
    entryDate: new Date('2025-01-25'),
    entryTime: '11:00',
    entryPrice: 410.20,
    exitDate: null, // Open trade
    exitTime: null,
    exitPrice: null,
    duration: '0 days',
    pnl: -150.75,
    percentChange: -0.49,
    orderType: 'Market',
    assessment: 'Currently underwater',
    capital: 30765.00,
    brokerId: 1,
    strategy: 'Earnings Play',
    riskReward: '1:4',
    commission: 2.00,
    notes: '<p>Earnings play - expecting positive guidance</p><p style="color: #ef4444;">Currently underwater, watching for support at $405</p>',
    tags: 'earnings,open'
  },
  {
    symbol: 'GOOGL',
    direction: 'Long',
    quantity: 60,
    entryDate: new Date('2025-01-12'),
    entryTime: '09:45',
    entryPrice: 142.80,
    exitDate: new Date('2025-01-16'),
    exitTime: '13:30',
    exitPrice: 147.90,
    duration: '4 days',
    pnl: 306.00,
    percentChange: 3.57,
    orderType: 'Market',
    assessment: 'Solid swing trade',
    capital: 8568.00,
    brokerId: 3,
    strategy: 'Swing Trading',
    riskReward: '1:2.5',
    commission: 0.00,
    notes: '<p>Clean swing trade setup. Respected support and pushed higher.</p>',
    tags: 'swing,tech'
  },
  {
    symbol: 'AMZN',
    direction: 'Short',
    quantity: 80,
    entryDate: new Date('2025-01-20'),
    entryTime: '14:00',
    entryPrice: 155.00,
    exitDate: new Date('2025-01-24'),
    exitTime: '10:30',
    exitPrice: 152.30,
    duration: '4 days',
    pnl: 216.00,
    percentChange: 1.74,
    orderType: 'Stop',
    assessment: 'Good timing on weakness',
    capital: 12400.00,
    brokerId: 2,
    strategy: 'Momentum',
    riskReward: '1:1.5',
    commission: 1.75,
    tags: 'momentum,short'
  },
  {
    symbol: 'META',
    direction: 'Long',
    quantity: 40,
    entryDate: new Date('2025-01-28'),
    entryTime: '12:15',
    entryPrice: 485.90,
    exitDate: null, // Open trade
    exitTime: null,
    exitPrice: null,
    duration: '0 days',
    pnl: 320.80,
    percentChange: 1.65,
    orderType: 'Limit',
    assessment: 'Looking good so far',
    capital: 19436.00,
    brokerId: 4,
    strategy: 'Growth',
    riskReward: '1:3',
    commission: 0.00,
    notes: '<p>Strong earnings beat, expecting continued momentum</p>',
    tags: 'growth,open,social-media'
  },
  {
    symbol: 'NVDA',
    direction: 'Long',
    quantity: 25,
    entryDate: new Date('2025-01-10'),
    entryTime: '09:30',
    entryPrice: 875.00,
    exitDate: new Date('2025-01-14'),
    exitTime: '15:00',
    exitPrice: 920.50,
    duration: '4 days',
    pnl: 1137.50,
    percentChange: 5.2,
    orderType: 'Market',
    assessment: 'Excellent AI momentum play',
    capital: 21875.00,
    brokerId: 1,
    strategy: 'AI Theme',
    riskReward: '1:4',
    commission: 2.50,
    notes: '<p>AI hype driving strong momentum. Rode the wave perfectly.</p><p><strong>Key insight:</strong> Semiconductor shortage creating scarcity premium</p>',
    tags: 'ai,semiconductors,momentum'
  },
  {
    symbol: 'SPY',
    direction: 'Long',
    quantity: 200,
    entryDate: new Date('2025-01-22'),
    entryTime: '10:00',
    entryPrice: 475.20,
    exitDate: new Date('2025-01-26'),
    exitTime: '15:30',
    exitPrice: 478.90,
    duration: '4 days',
    pnl: 740.00,
    percentChange: 0.78,
    orderType: 'Market',
    assessment: 'Safe index play',
    capital: 95040.00,
    brokerId: 3,
    strategy: 'Index Trading',
    riskReward: '1:2',
    commission: 0.00,
    notes: '<p>Market looking strong, rode the overall uptrend</p>',
    tags: 'index,safe,diversified'
  }
];

async function addTestData() {
  try {
    console.log('🚀 Starting to add test data...');

    // Check if brokers exist
    const brokerCount = await prisma.broker.count();
    if (brokerCount === 0) {
      console.log('❌ No brokers found! Run the broker seed first: npx ts-node prisma/seed.ts');
      return;
    }
    console.log(`✅ Found ${brokerCount} brokers`);

    // Clear existing trades (optional)
    const existingTrades = await prisma.trade.count();
    if (existingTrades > 0) {
      console.log(`⚠️  Found ${existingTrades} existing trades. Deleting them first...`);
      await prisma.trade.deleteMany();
    }

    // Add test trades
    console.log('📊 Adding test trades...');
    
    for (const trade of testTrades) {
      // Handle null values for open trades
      const tradeData = {
        ...trade,
        // Convert null dates to undefined for Prisma
        exitDate: trade.exitDate || undefined,
        exitTime: trade.exitTime || undefined,
        exitPrice: trade.exitPrice || undefined,
        notes: trade.notes || undefined,
        strategy: trade.strategy || undefined,
        riskReward: trade.riskReward || undefined,
        commission: trade.commission || undefined,
        tags: trade.tags || undefined,
        tradeId: undefined, // Add this field as undefined
        executionVenue: undefined, // Add this field as undefined
        assessment: trade.assessment || undefined
      };

      const createdTrade = await prisma.trade.create({
        data: tradeData
      });
      console.log(`✅ Added trade: ${createdTrade.symbol} (${createdTrade.direction}) - P&L: ${createdTrade.pnl}`);
    }

    // Show summary
    const totalTrades = await prisma.trade.count();
    const totalPnL = await prisma.trade.aggregate({
      _sum: { pnl: true }
    });

    console.log('\n🎉 Test data added successfully!');
    console.log(`📊 Total trades: ${totalTrades}`);
    console.log(`💰 Total P&L: $${totalPnL._sum.pnl?.toFixed(2) || 0}`);
    console.log('\n🚀 You can now test your trading journal!');

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addTestData();