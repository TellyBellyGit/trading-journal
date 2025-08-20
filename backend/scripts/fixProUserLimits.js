const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProUserLimits() {
  try {
    console.log('🔧 Fixing Pro user trade limits...');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'mabhatti@email.com' },
      include: { subscription: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Found user:', user.email);
    
    if (!user.subscription) {
      console.log('❌ No subscription found for user');
      return;
    }

    console.log('📊 Current subscription:');
    console.log('  Plan:', user.subscription.plan);
    console.log('  Max Trades:', user.subscription.maxTrades);
    console.log('  Current Count:', user.subscription.tradeCount);

    // Update Pro user to have unlimited trades
    if (user.subscription.plan === 'pro') {
      const updatedSubscription = await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          maxTrades: -1, // Unlimited trades for Pro
          tradeCount: 0  // Reset count to be safe
        }
      });

      console.log('✅ Updated subscription successfully!');
      console.log('📊 New settings:');
      console.log('  Plan:', updatedSubscription.plan);
      console.log('  Max Trades:', updatedSubscription.maxTrades, '(unlimited)');
      console.log('  Current Count:', updatedSubscription.tradeCount);
    } else {
      console.log(`ℹ️  User has '${user.subscription.plan}' plan - no changes needed`);
    }

  } catch (error) {
    console.error('❌ Error fixing Pro user limits:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixProUserLimits();