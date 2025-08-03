import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSubscriptionsDirectly() {
  try {
    console.log('📊 Creating free subscriptions directly in database...');

    // Get all users who don't have a subscription
    const usersWithoutSubscription = await prisma.user.findMany({
      where: {
        subscription: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`Found ${usersWithoutSubscription.length} users without subscriptions`);

    for (const user of usersWithoutSubscription) {
      try {
        console.log(`Creating subscription for user: ${user.email}`);
        
        const subscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: `dummy_customer_${user.id}`,
            plan: 'free',
            status: 'active',
            maxTrades: 25,
            tradeCount: 0,
            periodStartDate: new Date()
          }
        });
        
        console.log(`✅ Subscription created for ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to create subscription for ${user.email}:`, error);
      }
    }

    console.log('🎉 Finished creating subscriptions for existing users');
  } catch (error) {
    console.error('Error creating subscriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSubscriptionsDirectly();