const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSubscriptions() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true
          }
        }
      }
    });

    console.log('Current subscriptions:');
    subscriptions.forEach(sub => {
      console.log(`\nUser: ${sub.user.email} (${sub.user.firstName})`);
      console.log(`Plan: ${sub.plan}`);
      console.log(`Status: ${sub.status}`);
      console.log(`Cancel at period end: ${sub.cancelAtPeriodEnd}`);
      console.log(`Current period start: ${sub.currentPeriodStart}`);
      console.log(`Current period end: ${sub.currentPeriodEnd}`);
      console.log(`Period start date: ${sub.periodStartDate}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscriptions();