// Test script to verify reset password functionality
import axios from 'axios';

const backendUrl = 'http://localhost:4000';
const adminUrl = 'http://localhost:3001';

// Test if backend is running
async function testBackend() {
  try {
    const response = await axios.get(`${backendUrl}/api/admin/test`);
    console.log('✅ Backend is running:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Backend is not running or not responding');
    console.log('Please start the backend with: cd food_del_fyp/backend && npm start');
    return false;
  }
}

// Test if admin frontend is running
async function testAdmin() {
  try {
    const response = await axios.get(adminUrl);
    console.log('✅ Admin frontend is running');
    return true;
  } catch (error) {
    console.log('❌ Admin frontend is not running or not responding');
    console.log('Please start the admin with: cd food_del_fyp/admin && npm run dev');
    return false;
  }
}

// Test the reset password endpoint
async function testResetPasswordEndpoint() {
  try {
    const response = await axios.post(`${backendUrl}/api/admin/reset-password/invalid-token`, {
      password: 'testpassword123'
    });
    console.log('Reset password endpoint response:', response.data);
  } catch (error) {
    if (error.response && error.response.data) {
      console.log('✅ Reset password endpoint is working:', error.response.data);
    } else {
      console.log('❌ Reset password endpoint error:', error.message);
    }
  }
}

async function runTests() {
  console.log('🔄 Testing Reset Password Functionality...\n');
  
  const backendOk = await testBackend();
  const adminOk = await testAdmin();
  
  if (backendOk) {
    await testResetPasswordEndpoint();
  }
  
  console.log('\n📋 Summary:');
  console.log(`Backend: ${backendOk ? '✅ Running' : '❌ Not running'}`);
  console.log(`Admin Frontend: ${adminOk ? '✅ Running' : '❌ Not running'}`);
  
  if (backendOk && adminOk) {
    console.log('\n🎉 Both services are running! You can now test the reset password functionality.');
    console.log('📧 Send a forgot password email and click the link to test.');
  } else {
    console.log('\n⚠️  Please start the missing services before testing.');
  }
}

runTests().catch(console.error);