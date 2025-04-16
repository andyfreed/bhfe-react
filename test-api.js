// A simple script to test API connectivity
import fetch from 'node-fetch';

async function testApi() {
  try {
    // Try to access the main page
    console.log('Testing main page...');
    const mainResponse = await fetch('http://localhost:3000');
    console.log(`Main page status: ${mainResponse.status} ${mainResponse.statusText}`);
    
    // Set up admin user
    console.log('\nSetting up admin user...');
    try {
      const setupResponse = await fetch('http://localhost:3000/api/setup-admin');
      const setupData = await setupResponse.json();
      console.log(`Setup admin status: ${setupResponse.status} ${setupResponse.statusText}`);
      console.log('Response:', setupData);
    } catch (error) {
      console.error('Setup admin error:', error.message);
    }
    
    // Note: The following calls will likely fail due to authentication, 
    // but we can at least check if the routes are responding
    console.log('\nTesting API endpoints...');
    
    try {
      const usersResponse = await fetch('http://localhost:3000/api/users');
      console.log(`/api/users status: ${usersResponse.status} ${usersResponse.statusText}`);
    } catch (error) {
      console.error('/api/users error:', error.message);
    }
    
    try {
      const enrollmentsResponse = await fetch('http://localhost:3000/api/enrollments');
      console.log(`/api/enrollments status: ${enrollmentsResponse.status} ${enrollmentsResponse.statusText}`);
    } catch (error) {
      console.error('/api/enrollments error:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testApi().catch(console.error); 