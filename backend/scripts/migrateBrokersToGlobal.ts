import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OldBroker {
  id: number;
  name: string;
  displayName: string;
  accountType: string | null;
  accountId: string | null;
  isActive: boolean;
  defaultCommission: number | null;
  commissionType: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GlobalBroker {
  id: number;
  name: string;
  displayName: string;
  isActive: boolean;
  defaultCommission: number | null;
  commissionType: string | null;
}

async function migrateBrokersToGlobal() {
  console.log('🚀 Starting broker migration to global system...');
  
  try {
    // 1. Get all existing brokers (user-scoped)
    const existingBrokers = await prisma.$queryRaw<OldBroker[]>`
      SELECT * FROM "Broker" ORDER BY "name", "createdAt"
    `;
    
    console.log(`📊 Found ${existingBrokers.length} existing user-scoped brokers`);
    
    if (existingBrokers.length === 0) {
      console.log('✅ No existing brokers to migrate');
      return;
    }
    
    // 2. Group brokers by name to identify duplicates
    const brokerGroups = new Map<string, OldBroker[]>();
    for (const broker of existingBrokers) {
      const normalizedName = broker.name.trim().toLowerCase();
      if (!brokerGroups.has(normalizedName)) {
        brokerGroups.set(normalizedName, []);
      }
      brokerGroups.get(normalizedName)!.push(broker);
    }
    
    console.log(`📋 Found ${brokerGroups.size} unique broker names`);
    
    // 3. Create consolidated broker list
    const consolidatedBrokers: {
      name: string;
      displayName: string;
      isActive: boolean;
      defaultCommission: number | null;
      commissionType: string | null;
      userMappings: { userId: number; oldBrokerId: number; accountType?: string; accountId?: string; customCommission?: number; displayName?: string }[];
    }[] = [];
    
    for (const [normalizedName, brokers] of brokerGroups) {
      // Use the first broker as the template for the global broker
      const template = brokers[0];
      
      // Create consolidated broker
      const consolidated = {
        name: template.name.trim(),
        displayName: template.displayName || template.name.trim(),
        isActive: brokers.some(b => b.isActive), // Active if any user has it active
        defaultCommission: template.defaultCommission,
        commissionType: template.commissionType,
        userMappings: brokers.map(b => ({
          userId: b.userId,
          oldBrokerId: b.id,
          accountType: b.accountType || undefined,
          accountId: b.accountId || undefined,
          customCommission: b.defaultCommission !== template.defaultCommission ? b.defaultCommission || undefined : undefined,
          displayName: b.displayName !== template.displayName ? b.displayName || undefined : undefined
        }))
      };
      
      consolidatedBrokers.push(consolidated);
    }
    
    console.log(`🔄 Will create ${consolidatedBrokers.length} global brokers`);
    
    // 4. Start transaction to migrate data
    await prisma.$transaction(async (tx) => {
      console.log('🏗️ Starting database transaction...');
      
      // Create a mapping from old broker IDs to new global broker IDs
      const brokerIdMapping = new Map<number, number>();
      
      // 5. Create global brokers and user broker accounts
      for (const consolidated of consolidatedBrokers) {
        // Create global broker (schema should be updated by now)
        const globalBroker = await tx.broker.create({
          data: {
            name: consolidated.name,
            displayName: consolidated.displayName,
            isActive: consolidated.isActive,
            defaultCommission: consolidated.defaultCommission,
            commissionType: consolidated.commissionType
          }
        });
        
        console.log(`✅ Created global broker: ${globalBroker.name} (ID: ${globalBroker.id})`);
        
        // Create user broker accounts for each user that had this broker
        for (const userMapping of consolidated.userMappings) {
          await tx.userBrokerAccount.create({
            data: {
              userId: userMapping.userId,
              brokerId: globalBroker.id,
              accountType: userMapping.accountType,
              accountId: userMapping.accountId,
              customCommission: userMapping.customCommission,
              displayName: userMapping.displayName,
              isActive: true
            }
          });
          
          // Map old broker ID to new global broker ID
          brokerIdMapping.set(userMapping.oldBrokerId, globalBroker.id);
        }
        
        console.log(`📝 Created ${consolidated.userMappings.length} user broker accounts for ${globalBroker.name}`);
      }
      
      // 6. Update all trades to use new global broker IDs
      console.log('🔄 Updating trade broker references...');
      let updatedTrades = 0;
      
      for (const [oldBrokerId, newBrokerId] of brokerIdMapping) {
        const result = await tx.trade.updateMany({
          where: { brokerId: oldBrokerId },
          data: { brokerId: newBrokerId }
        });
        updatedTrades += result.count;
      }
      
      console.log(`✅ Updated ${updatedTrades} trade records`);
      
      // 7. Delete old user-scoped brokers (this will be handled by schema migration)
      console.log('📋 Old broker records will be cleaned up by schema migration');
    });
    
    console.log('🎉 Broker migration completed successfully!');
    console.log(`📊 Migration Summary:`);
    console.log(`   • Migrated ${existingBrokers.length} user-scoped brokers`);
    console.log(`   • Created ${consolidatedBrokers.length} global brokers`);
    console.log(`   • Created ${consolidatedBrokers.reduce((sum, b) => sum + b.userMappings.length, 0)} user broker accounts`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateBrokersToGlobal()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateBrokersToGlobal };