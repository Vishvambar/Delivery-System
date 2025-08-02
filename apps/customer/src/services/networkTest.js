import { api, API_BASE_URL } from './api';

export const testNetworkConnectivity = async () => {
  console.log('🔍 Testing network connectivity...');
  console.log('🌐 API Base URL:', API_BASE_URL);
  
  try {
    // Test 1: Simple health check
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await fetch(API_BASE_URL.replace('/api', '/health'), {
      method: 'GET',
      timeout: 5000
    });
    console.log('✅ Health check success:', await healthResponse.text());
    
    // Test 2: Test vendors endpoint (public)
    console.log('🏪 Testing vendors endpoint...');
    const vendorsResponse = await api.get('/vendors');
    console.log('✅ Vendors endpoint success:', vendorsResponse.data.data.vendors.length, 'vendors');
    
    return { success: true, message: 'All tests passed' };
  } catch (error) {
    console.error('❌ Network test failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0]
    });
    return { success: false, error };
  }
};

export const testDifferentURLs = async () => {
  const urls = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://192.168.5.110:5000',
    'http://10.0.2.2:5000'
  ];
  
  for (const url of urls) {
    try {
      console.log(`🔍 Testing URL: ${url}`);
      const response = await fetch(`${url}/health`, { 
        method: 'GET', 
        timeout: 3000 
      });
      const result = await response.text();
      console.log(`✅ ${url} - SUCCESS:`, result);
    } catch (error) {
      console.log(`❌ ${url} - FAILED:`, error.message);
    }
  }
};
