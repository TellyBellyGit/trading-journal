import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upgradeAdminToPro() {
  try {
    console.log('🚀 Upgrading admin user to Pro plan for testing...');

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

    // Upgrade to Pro plan with unlimited trades
    const updatedSubscription = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan: 'pro',
        maxTrades: -1, // unlimited
        tradeCount: 0, // reset count
        status: 'active'
      }
    });

    console.log(`✅ Admin user upgraded to Pro plan: ${updatedSubscription.plan} (unlimited trades)`);
  } catch (error) {
    console.error('Error upgrading admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
upgradeAdminToPro();