const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSubscriptionDates() {
  try {
    const subscriptions = await prisma.subscription.findMany();

    console.log(`Found ${subscriptions.length} subscriptions to update`);

    for (const sub of subscriptions) {
      const now = new Date();
      const periodStart = sub.currentPeriodStart || now;
      
      // Set period end to end of current month
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const updated = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd
        }
      });

      console.log(`Updated subscription for user ${sub.userId}:`);
      console.log(`  - Current period start: ${updated.currentPeriodStart}`);
      console.log(`  - Current period end: ${updated.currentPeriodEnd}`);
    }

    console.log('All subscriptions updated successfully!');
  } catch (error) {
    console.error('Error updating subscriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSubscriptionDates();