import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function postMigrationSetup() {
  console.log('🚀 Setting up default brokers after schema migration...');
  
  try {
    // Create some common default brokers that users can select from
    const defaultBrokers = [
      {
        name: 'TD Ameritrade',
        displayName: 'TD Ameritrade',
        isActive: true,
        defaultCommission: 0.65,
        commissionType: 'per_trade'
      },
      {
        name: 'Interactive Brokers',
        displayName: 'Interactive Brokers',
        isActive: true,
        defaultCommission: 0.005,
        commissionType: 'per_share'
      },
      {
        name: 'E*TRADE',
        displayName: 'E*TRADE',
        isActive: true,
        defaultCommission: 0.00,
        commissionType: 'per_trade'
      },
      {
        name: 'Fidelity',
        displayName: 'Fidelity',
        isActive: true,
        defaultCommission: 0.00,
        commissionType: 'per_trade'
      },
      {
        name: 'Charles Schwab',
        displayName: 'Charles Schwab',
        isActive: true,
        defaultCommission: 0.00,
        commissionType: 'per_trade'
      },
      {
        name: 'Robinhood',
        displayName: 'Robinhood',
        isActive: true,
        defaultCommission: 0.00,
        commissionType: 'per_trade'
      },
      {
        name: 'Webull',
        displayName: 'Webull',
        isActive: true,
        defaultCommission: 0.00,
        commissionType: 'per_trade'
      },
      {
        name: 'Default Broker',
        displayName: 'Default Trading Account',
        isActive: true,
        defaultCommission: null,
        commissionType: null
      }
    ];

    let createdCount = 0;
    
    for (const brokerData of defaultBrokers) {
      // Check if broker already exists
      const existing = await prisma.broker.findUnique({
        where: { name: brokerData.name }
      });
      
      if (!existing) {
        await prisma.broker.create({
          data: brokerData
        });
        console.log(`✅ Created default broker: ${brokerData.name}`);
        createdCount++;
      } else {
        console.log(`🔄 Broker already exists: ${brokerData.name}`);
      }
    }
    
    console.log(`🎉 Post-migration setup completed! Created ${createdCount} default brokers.`);
    console.log(`📊 Users can now import trades and brokers will be auto-created as needed.`);
    
  } catch (error) {
    console.error('❌ Post-migration setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  postMigrationSetup()
    .then(() => {
      console.log('✅ Post-migration setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Post-migration setup failed:', error);
      process.exit(1);
    });
}

export { postMigrationSetup };