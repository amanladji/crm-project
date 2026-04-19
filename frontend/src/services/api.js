import axios from 'axios';

// Determine the API base URL based on environment
// For development: use localhost:8081
// For production: use Render backend URL from env variable
const getApiUrl = () => {
  console.log('🔍 Determining API URL...');
  console.log('VITE_API_BASE_URL env:', import.meta.env.VITE_API_BASE_URL);
  console.log('PROD mode:', import.meta.env.PROD);
  
  if (import.meta.env.VITE_API_BASE_URL) {
    // Use explicit env variable if set
    console.log('✅ Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (import.meta.env.PROD) {
    // Production: use Render backend
    console.log('✅ Using production Render URL');
    return 'https://crm-project-ve1d.onrender.com';
  }
  
  // Development: use localhost
  console.log('✅ Using development localhost:8081');
  return 'http://localhost:8081';
};

const API_BASE = getApiUrl();
const API_URL = `${API_BASE}/api`;

console.log('🔧 API Configuration Loaded:', {
  environment: import.meta.env.PROD ? 'production' : 'development',
  baseUrl: API_BASE,
  apiUrl: API_URL,
  timestamp: new Date().toISOString()
});

const api = axios.create({
  baseURL: API_URL,
});

// Track API calls for debugging infinite loops
const apiCallTracker = {};

console.log('✅ Axios instance created with baseURL:', API_URL);

api.interceptors.request.use((config) => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
        console.log('🔐 JWT token added to request headers');
      }
    } else {
      console.log('⚠️ No user object in localStorage');
    }
  } catch (e) {
    console.error('Error parsing user from localStorage', e);
  }
  
  // Track call frequency
  const endpoint = `${config.method.toUpperCase()} ${config.url}`;
  if (!apiCallTracker[endpoint]) {
    apiCallTracker[endpoint] = [];
  }
  apiCallTracker[endpoint].push(new Date().getTime());
  
  // Keep only last 10 calls
  if (apiCallTracker[endpoint].length > 10) {
    apiCallTracker[endpoint].shift();
  }
  
  // Check for rapid repeated calls (more than 2 in 2 seconds = potential loop)
  const recentCalls = apiCallTracker[endpoint].filter(
    time => new Date().getTime() - time < 2000
  );
  
  if (recentCalls.length > 2) {
    console.warn(`⚠️ RAPID API CALLS DETECTED: ${endpoint} called ${recentCalls.length} times in 2 seconds`);
  }
  
  console.log('📤 API Request:', {
    method: config.method,
    url: config.url,
    fullUrl: `${API_URL}${config.url}`,
    hasAuth: !!config.headers.Authorization,
    recentCallCount: recentCalls.length,
    timestamp: new Date().toLocaleTimeString()
  });
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data)
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      fullUrl: error.config ? `${API_URL}${error.config.url}` : 'unknown'
    });
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expired or invalid user, clear local storage and redirect
      console.warn('🔑 Authentication failed - clearing session');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;