// backend/src/scripts/clearTrades.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTradesOnly() {
  try {
    console.log('🧹 Clearing trades table...');
    
    const deletedTrades = await prisma.trade.deleteMany({});
    console.log(`✅ Deleted ${deletedTrades.count} trades`);
    console.log('✅ All other tables preserved (brokers, etc.)');
    console.log('🎉 Trades table cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing trades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearTradesOnly();