const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Mypassword123@', 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@tradrdash.com',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        emailVerified: true,
        isAdmin: true,
        timezone: 'UTC',
        isActive: true
      }
    });

    console.log('🎉 Admin user created successfully!');
    console.log('Email: admin@tradrdash.com');
    console.log('Password: Mypassword123@');
    console.log('User ID:', admin.id);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();