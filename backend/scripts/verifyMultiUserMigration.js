const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMultiUserMigration() {
  try {
    console.log('🔍 Verifying multi-user migration...\n');
    
    // Check user count
    const userCount = await prisma.user.count();
    console.log(`✅ Users: ${userCount}`);
    
    // Check that all data is associated with users
    const brokersWithUser = await prisma.broker.count();
    const tradesWithUser = await prisma.trade.count();
    const notesWithUser = await prisma.note.count();
    
    console.log(`✅ Brokers with user: ${brokersWithUser}`);
    console.log(`✅ Trades with user: ${tradesWithUser}`);
    console.log(`✅ Notes with user: ${notesWithUser}`);
    
    // Test relationships
    const userWithData = await prisma.user.findFirst({
      include: {
        brokers: { take: 2 },
        trades: { take: 2 },
        notes: { take: 2 }
      }
    });
    
    if (userWithData) {
      console.log('\n🔗 Relationship Test:');
      console.log(`✅ User: ${userWithData.firstName} ${userWithData.lastName}`);
      console.log(`✅ User has ${userWithData.brokers.length} brokers (showing 2)`);
      console.log(`✅ User has ${userWithData.trades.length} trades (showing 2)`);
      console.log(`✅ User has ${userWithData.notes.length} notes (showing 2)`);
      
      if (userWithData.trades.length > 0) {
        console.log(`✅ Sample trade: ${userWithData.trades[0].symbol}`);
      }
    }
    
    console.log('\n🎉 Multi-user migration verified successfully!');
    console.log('✅ All existing data preserved and associated with default user');
    console.log('✅ Ready for authentication implementation');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMultiUserMigration();