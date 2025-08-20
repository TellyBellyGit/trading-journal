const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createProUser() {
  try {
    console.log('🔄 Creating verified pro user...');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'mabhatti@email.com' }
    });

    if (existingUser) {
      console.log('⚠️  User already exists:', existingUser.email);
      console.log('📧 Email:', existingUser.email);
      console.log('✅ Verified:', existingUser.emailVerified);
      console.log('👑 Admin:', existingUser.isAdmin);
      
      // Check subscription status
      const subscription = await prisma.subscription.findUnique({
        where: { userId: existingUser.id }
      });
      
      if (subscription) {
        console.log('💳 Subscription:', subscription.plan);
        console.log('📅 Status:', subscription.status);
      } else {
        console.log('💳 Subscription: None found');
      }
      
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Mypassword123!', 12);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: 'mabhatti@email.com',
        firstName: 'M',
        lastName: 'Bhatti',
        password: hashedPassword,
        emailVerified: true,
        isAdmin: false,
        timezone: 'America/New_York',
        isActive: true
      }
    });

    console.log('✅ User created successfully!');
    console.log('📧 Email: mabhatti@email.com');
    console.log('🔑 Password: Mypassword123!');
    console.log('👤 User ID:', user.id);

    // Create Pro subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: `cus_test_${user.id}`, // Test customer ID
        stripeSubscriptionId: `sub_test_${user.id}`, // Test subscription ID
        plan: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('💳 Pro subscription created!');
    console.log('📊 Plan: pro');
    console.log('✅ Status: active');
    console.log('📅 Valid until:', subscription.currentPeriodEnd.toLocaleDateString());

    console.log('\n🎉 Setup complete! User can now log in with full pro features.');

  } catch (error) {
    console.error('❌ Error creating pro user:', error.message);
    if (error.code) {
      console.error('🔍 Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createProUser();