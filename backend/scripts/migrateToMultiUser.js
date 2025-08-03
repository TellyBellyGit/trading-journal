const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function migrateToMultiUser() {
  try {
    console.log('🔄 Starting migration to multi-user schema...');
    
    // 1. First, let's manually add the User table without foreign key constraints
    console.log('Creating User table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" SERIAL PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "timezone" TEXT DEFAULT 'UTC',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // 2. Create a default user for existing data
    console.log('Creating default user...');
    const hashedPassword = await bcrypt.hash('defaultpassword123', 10);
    
    const defaultUser = await prisma.$executeRaw`
      INSERT INTO "User" ("email", "password", "firstName", "lastName", "createdAt", "updatedAt")
      VALUES ('admin@tradingjournal.com', ${hashedPassword}, 'Default', 'User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("email") DO NOTHING
      RETURNING "id";
    `;
    
    // Get the default user ID
    const user = await prisma.$queryRaw`
      SELECT "id" FROM "User" WHERE "email" = 'admin@tradingjournal.com' LIMIT 1;
    `;
    
    const defaultUserId = user[0].id;
    console.log(`Default user created with ID: ${defaultUserId}`);
    
    // 3. Add userId columns to existing tables
    console.log('Adding userId columns...');
    await prisma.$executeRaw`ALTER TABLE "Broker" ADD COLUMN IF NOT EXISTS "userId" INTEGER;`;
    await prisma.$executeRaw`ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "userId" INTEGER;`;
    await prisma.$executeRaw`ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "userId" INTEGER;`;
    
    // 4. Update all existing records to belong to the default user
    console.log('Assigning existing data to default user...');
    
    const brokerUpdate = await prisma.$executeRaw`
      UPDATE "Broker" SET "userId" = ${defaultUserId} WHERE "userId" IS NULL;
    `;
    
    const tradeUpdate = await prisma.$executeRaw`
      UPDATE "Trade" SET "userId" = ${defaultUserId} WHERE "userId" IS NULL;
    `;
    
    const noteUpdate = await prisma.$executeRaw`
      UPDATE "Note" SET "userId" = ${defaultUserId} WHERE "userId" IS NULL;
    `;
    
    console.log(`Updated ${brokerUpdate} brokers, ${tradeUpdate} trades, ${noteUpdate} notes`);
    
    // 5. Make userId columns NOT NULL
    console.log('Making userId columns required...');
    await prisma.$executeRaw`ALTER TABLE "Broker" ALTER COLUMN "userId" SET NOT NULL;`;
    await prisma.$executeRaw`ALTER TABLE "Trade" ALTER COLUMN "userId" SET NOT NULL;`;
    await prisma.$executeRaw`ALTER TABLE "Note" ALTER COLUMN "userId" SET NOT NULL;`;
    
    // 6. Add foreign key constraints
    console.log('Adding foreign key constraints...');
    await prisma.$executeRaw`
      ALTER TABLE "Broker" 
      ADD CONSTRAINT "Broker_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Trade" 
      ADD CONSTRAINT "Trade_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Note" 
      ADD CONSTRAINT "Note_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    `;
    
    // 7. Remove unique constraint on Broker.name and add composite unique constraint
    console.log('Updating broker constraints...');
    await prisma.$executeRaw`ALTER TABLE "Broker" DROP CONSTRAINT IF EXISTS "Broker_name_key";`;
    await prisma.$executeRaw`
      ALTER TABLE "Broker" 
      ADD CONSTRAINT "Broker_userId_name_key" 
      UNIQUE ("userId", "name");
    `;
    
    console.log('✅ Migration to multi-user schema completed!');
    
    // Verify the migration
    const userCount = await prisma.user.count();
    const brokerCount = await prisma.broker.count();
    const tradeCount = await prisma.trade.count();
    const noteCount = await prisma.note.count();
    
    console.log('\n📊 Migration Results:');
    console.log(`✅ Users: ${userCount}`);
    console.log(`✅ Brokers: ${brokerCount}`);
    console.log(`✅ Trades: ${tradeCount}`);
    console.log(`✅ Notes: ${noteCount}`);
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('Email: admin@tradingjournal.com');
    console.log('Password: defaultpassword123');
    console.log('(Please change this password after first login!)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToMultiUser();