const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('Verifying PostgreSQL data...');
    
    const brokerCount = await prisma.broker.count();
    const tradeCount = await prisma.trade.count();
    const noteCount = await prisma.note.count();
    
    console.log(`✓ Brokers: ${brokerCount}`);
    console.log(`✓ Trades: ${tradeCount}`);
    console.log(`✓ Notes: ${noteCount}`);
    
    // Test a sample trade with broker relationship
    const sampleTrade = await prisma.trade.findFirst({
      include: {
        broker: true
      }
    });
    
    if (sampleTrade) {
      console.log(`✓ Sample trade: ${sampleTrade.symbol} (${sampleTrade.broker.name})`);
    }
    
    console.log('\n🎉 PostgreSQL migration completed successfully!');
    
  } catch (error) {
    console.error('Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();