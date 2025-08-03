const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Test login with admin credentials
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@tradingjournal.com',
      password: 'defaultpassword123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', loginResponse.data);
    
    // Test protected endpoint
    const token = loginResponse.data.token;
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Protected endpoint working!');
    console.log('User data:', meResponse.data);
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAuth();