const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Update the admin user password
    const admin = await prisma.user.update({
      where: { email: 'admin@tradingjournal.com' },
      data: {
        password: hashedPassword,
        emailVerified: true,
        isAdmin: true,
        isActive: true
      }
    });

    console.log('✅ Admin password reset successfully!');
    console.log('Email: admin@tradingjournal.com');
    console.log('Password: admin123');
    console.log('User ID:', admin.id);

  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();