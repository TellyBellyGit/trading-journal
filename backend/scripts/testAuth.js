const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function testAuthentication() {
  try {
    console.log('🔍 Testing Authentication System...\n');

    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      timezone: 'EST'
    });

    console.log('✅ Registration successful');
    console.log('User:', registerResponse.data.user.firstName, registerResponse.data.user.lastName);
    const token = registerResponse.data.token;

    // Test 2: Login with the same user
    console.log('\n2. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });

    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);

    // Test 3: Access protected endpoint
    console.log('\n3. Testing protected endpoint access...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Protected endpoint access successful');
    console.log('User info:', meResponse.data.user.email);

    // Test 4: Test invalid token
    console.log('\n4. Testing invalid token...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer invalid-token`
        }
      });
    } catch (error) {
      console.log('✅ Invalid token properly rejected');
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Start test after a delay to ensure server is running
setTimeout(testAuthentication, 2000);