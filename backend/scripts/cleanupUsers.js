const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupUsers() {
  try {
    // Show current users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isAdmin: true,
        createdAt: true
      }
    });

    console.log('📋 Current users:');
    users.forEach(user => {
      console.log(`- ${user.email} | Verified: ${user.emailVerified} | Admin: ${user.isAdmin} | Created: ${user.createdAt.toISOString().split('T')[0]}`);
    });

    // Delete unverified users
    const result = await prisma.user.deleteMany({
      where: {
        emailVerified: false
      }
    });

    console.log(`🗑️  Deleted ${result.count} unverified users`);

    // Show remaining users
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isAdmin: true
      }
    });

    console.log('✅ Remaining users:');
    remainingUsers.forEach(user => {
      console.log(`- ${user.email} | Verified: ${user.emailVerified} | Admin: ${user.isAdmin}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUsers();