// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample brokers
  const brokers = [
    {
      name: 'TD Ameritrade',
      displayName: 'TD Ameritrade - Main Account',
      accountType: 'Taxable',
      defaultCommission: 0.65,
      commissionType: 'per_trade'
    },
    {
      name: 'Interactive Brokers',
      displayName: 'IBKR - Pro Account',
      accountType: 'Taxable',
      defaultCommission: 0.35,
      commissionType: 'per_trade'
    },
    {
      name: 'Charles Schwab',
      displayName: 'Schwab - Commission Free',
      accountType: 'IRA',
      defaultCommission: 0.00,
      commissionType: 'per_trade'
    },
    {
      name: 'Fidelity',
      displayName: 'Fidelity - Brokerage',
      accountType: 'Taxable',
      defaultCommission: 0.00,
      commissionType: 'per_trade'
    }
  ];

  console.log('Creating brokers...');
  
  for (const brokerData of brokers) {
    const broker = await prisma.broker.upsert({
      where: { name: brokerData.name },
      update: {},
      create: brokerData
    });
    console.log(`Created/found broker: ${broker.name}`);
  }

  console.log('Seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });