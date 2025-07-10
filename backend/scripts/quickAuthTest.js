const axios = require('axios');

async function quickAuthTest() {
  try {
    console.log('🔍 Quick Authentication Test...\n');

    // Test registration
    console.log('1. Testing registration...');
    const response = await axios.post('http://localhost:3004/api/auth/register', {
      email: 'newuser@test.com',
      password: 'TestPassword123!',
      firstName: 'New',
      lastName: 'User'
    });

    console.log('✅ Registration successful!');
    console.log('User:', response.data.user.firstName, response.data.user.lastName);
    console.log('Token received:', response.data.token ? 'Yes' : 'No');

    // Test login with existing default user
    console.log('\n2. Testing login with default user...');
    const loginResponse = await axios.post('http://localhost:3004/api/auth/login', {
      email: 'admin@tradingjournal.com',
      password: 'defaultpassword123'
    });

    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
    
    console.log('\n🎉 Authentication system is working!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

quickAuthTest();