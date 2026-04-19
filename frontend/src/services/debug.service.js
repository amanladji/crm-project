/**
 * API Debugging Utility
 * Use this to test API connectivity and diagnose issues
 */

export const debugApiConnection = async () => {
  console.log('🔍 ========== API DEBUGGING STARTED ==========');
  
  // Check environment variables
  console.log('\n1️⃣ Environment Variables:');
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('PROD mode:', import.meta.env.PROD);
  console.log('DEV mode:', import.meta.env.DEV);
  
  // Check localStorage
  console.log('\n2️⃣ LocalStorage:');
  const userStr = localStorage.getItem('user');
  console.log('User object exists:', !!userStr);
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('User parsed successfully');
      console.log('Username:', user.username);
      console.log('Token exists:', !!user.token);
      console.log('Token length:', user.token?.length);
      console.log('Token preview:', user.token?.substring(0, 20) + '...');
    } catch (e) {
      console.error('❌ Failed to parse user object:', e.message);
    }
  }
  
  // Test API configuration
  console.log('\n3️⃣ API Configuration:');
  try {
    const api = (await import('./api')).default;
    console.log('Axios instance created successfully');
    console.log('Base URL:', api.defaults.baseURL);
  } catch (e) {
    console.error('❌ Failed to import api:', e.message);
  }
  
  // Test API connectivity
  console.log('\n4️⃣ API Connectivity Test:');
  try {
    const api = (await import('./api')).default;
    console.log('Testing GET /users endpoint...');
    
    const response = await api.get('/users', {
      timeout: 5000
    });
    
    console.log('✅ API call successful!');
    console.log('Status:', response.status);
    console.log('Data type:', typeof response.data);
    console.log('Is array:', Array.isArray(response.data));
    console.log('Data length:', response.data?.length || 'N/A');
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('First user:', response.data[0]);
    }
    
    return {
      success: true,
      status: response.status,
      userCount: response.data?.length || 0,
      data: response.data
    };
    
  } catch (error) {
    console.error('❌ API call failed!');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Request URL:', error.config?.url);
    console.error('Full URL:', error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown');
    console.error('Status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url
    };
  }
};

// Export for use in browser console
window.debugApiConnection = debugApiConnection;

console.log('✅ Debugging utility loaded. Run: debugApiConnection() in console to test API');

/**
 * Monitor API call frequency to detect infinite loops
 * Shows which endpoints are being called most frequently
 * Run: debugMonitorApiCalls() in browser console
 */
export const debugMonitorApiCalls = () => {
  console.log('🔍 ========== API CALL MONITOR STARTED ==========');
  console.log('Monitoring API calls for 10 seconds...');
  console.log('Look for warnings about rapid repeated calls (⚠️ RAPID API CALLS DETECTED)');
  
  // This will run for 10 seconds and collect data
  const startTime = new Date().getTime();
  const maxDuration = 10000; // 10 seconds
  let callCount = 0;
  let rapidCallWarnings = 0;
  
  // Patch console.log to count warnings
  const originalLog = console.log;
  const originalWarn = console.warn;
  
  let patchedLogs = [];
  
  const tempLog = (...args) => {
    originalLog(...args);
    callCount++;
    
    const message = args.map(a => String(a)).join(' ');
    if (message.includes('📤 API Request')) {
      patchedLogs.push({ type: 'request', message, time: new Date().toLocaleTimeString() });
    }
  };
  
  const tempWarn = (...args) => {
    originalWarn(...args);
    const message = args.map(a => String(a)).join(' ');
    if (message.includes('RAPID API CALLS')) {
      rapidCallWarnings++;
      patchedLogs.push({ type: 'warning', message, time: new Date().toLocaleTimeString() });
    }
  };
  
  // Replace for monitoring duration
  console.log = tempLog;
  console.warn = tempWarn;
  
  // Restore after 10 seconds
  setTimeout(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    
    console.log('\n🔍 ========== API CALL MONITOR RESULTS ==========');
    console.log('Duration: 10 seconds');
    console.log('Total console logs:', callCount);
    console.log('Rapid call warnings detected:', rapidCallWarnings);
    
    if (rapidCallWarnings > 0) {
      console.log('\n❌ INFINITE LOOP DETECTED!');
      console.log('Your API is being called too frequently.');
      console.log('Recent calls:');
      patchedLogs.forEach(log => {
        console.log(`  [${log.time}] ${log.type === 'warning' ? '⚠️' : '📤'} ${log.message.substring(0, 80)}`);
      });
    } else {
      console.log('\n✅ No rapid API calls detected (good!)');
    }
    
    console.log('\n📋 Recent API Requests:');
    const requestLogs = patchedLogs.filter(l => l.type === 'request').slice(-5);
    if (requestLogs.length === 0) {
      console.log('  (No API requests made during monitoring period)');
    } else {
      requestLogs.forEach(log => {
        console.log(`  [${log.time}] ${log.message}`);
      });
    }
  }, maxDuration);
};

window.debugMonitorApiCalls = debugMonitorApiCalls;

console.log('✅ API Call Monitor loaded. Run: debugMonitorApiCalls() to monitor for 10 seconds');
