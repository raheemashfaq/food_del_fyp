// Test script to verify backend connectivity
// Run this in browser console or as a Node.js script

const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    
    // Test basic server connection
    const testResponse = await fetch('http://localhost:4000/api/admin/test');
    const testData = await testResponse.json();
    console.log('Server test:', testData);
    
    // Try to create initial admin
    console.log('Creating initial admin...');
    const createResponse = await fetch('http://localhost:4000/api/admin/create-initial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const createData = await createResponse.json();
    console.log('Create admin result:', createData);
    
    // Test admin login
    console.log('Testing admin login...');
    const loginResponse = await fetch('http://localhost:4000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@fooddelivery.com',
        password: 'admin123456'
      })
    });
    const loginData = await loginResponse.json();
    console.log('Login test:', loginData);
    
  } catch (error) {
    console.error('Backend test failed:', error);
    console.log('Make sure:');
    console.log('1. Backend server is running on port 4000');
    console.log('2. Database is connected');
    console.log('3. Run: cd backend && npm start');
  }
};

// Uncomment to run the test
// testBackendConnection();

export default testBackendConnection;