// backend/scripts/addSimpleTestData.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple closed trades only (no null values to avoid Prisma issues)
const testTrades = [
  {
    symbol: 'GGGG',
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
    brokerId: 1
  },
  {
    symbol: 'HHHH',
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
    brokerId: 2
  },
  {
    symbol: 'IIII',
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
    brokerId: 3
  },
  {
    symbol: 'JJJJ',
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
    brokerId: 2
  },
  {
    symbol: 'KKKK',
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
    brokerId: 1
  },
  {
    symbol: 'LLLL',
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
    brokerId: 3
  }
];

async function addSimpleTestData() {
  try {
    console.log('🚀 Starting to add simple test data...');

    // Check if brokers exist
    const brokerCount = await prisma.broker.count();
    if (brokerCount === 0) {
      console.log('❌ No brokers found! Run the broker seed first: npx ts-node prisma/seed.ts');
      return;
    }
    console.log(`✅ Found ${brokerCount} brokers`);

    // Clear existing trades (optional)
   // const existingTrades = await prisma.trade.count();
    //if (existingTrades > 0) {
      //console.log(`⚠️  Found ${existingTrades} existing trades. Deleting them first...`);
      //await prisma.trade.deleteMany();
    //}

    // Add test trades one by one
    console.log('📊 Adding test trades...');
    
    for (const trade of testTrades) {
      try {
        const createdTrade = await prisma.trade.create({
          data: trade
        });
        console.log(`✅ Added trade: ${createdTrade.symbol} (${createdTrade.direction}) - P&L: $${createdTrade.pnl}`);
      } catch (error) {
        console.error(`❌ Error adding trade ${trade.symbol}:`, error);
      }
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
    console.log('💡 All trades are closed trades - you can add open trades manually via Prisma Studio if needed');

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSimpleTestData();