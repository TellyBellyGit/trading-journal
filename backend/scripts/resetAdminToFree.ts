import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAdminToFree() {
  try {
    console.log('🔄 Resetting admin user to Free plan...');

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@tradingjournal.com' },
      include: { subscription: true }
    });

    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    if (!user.subscription) {
      console.log('❌ Admin user has no subscription');
      return;
    }

    console.log(`📊 Current plan: ${user.subscription.plan} (${user.subscription.tradeCount}/${user.subscription.maxTrades} trades)`);

    // Reset to Free plan with 25 trades limit
    const updatedSubscription = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan: 'free',
        maxTrades: 25,
        tradeCount: 0, // reset count
        status: 'active'
      }
    });

    console.log(`✅ Admin user reset to Free plan: ${updatedSubscription.plan} (${updatedSubscription.tradeCount}/${updatedSubscription.maxTrades} trades)`);
  } catch (error) {
    console.error('Error resetting admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetAdminToFree();