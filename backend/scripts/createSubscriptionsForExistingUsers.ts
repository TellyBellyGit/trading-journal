import { PrismaClient } from '@prisma/client';
import SubscriptionService from '../src/services/subscriptionService';

const prisma = new PrismaClient();

async function createSubscriptionsForExistingUsers() {
  try {
    console.log('📊 Creating free subscriptions for existing users...');

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
        await SubscriptionService.createFreeSubscription(user.id, user.email);
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
createSubscriptionsForExistingUsers();