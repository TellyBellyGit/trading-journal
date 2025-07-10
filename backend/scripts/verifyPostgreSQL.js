const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPostgreSQL() {
  try {
    // Get database info from Prisma
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database connection verified!');
    console.log('Database version:', result[0].version);
    
    // Check if we're really using PostgreSQL
    if (result[0].version.includes('PostgreSQL')) {
      console.log('✅ Confirmed: Running on PostgreSQL');
    } else {
      console.log('❌ Warning: Not running on PostgreSQL');
    }
    
    // Show current database URL (without password)
    const dbUrl = process.env.DATABASE_URL || 'Not found';
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log('Database URL:', maskedUrl);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPostgreSQL();