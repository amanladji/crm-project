import api from './api';
import { jwtDecode } from 'jwt-decode';

const login = (username, password) => {
  return api.post('/auth/login', { username, password })
    .then((response) => {
      console.log('✅ Login Response:', response.data);
      
      if (response.data.token) {
        // Save user object
        localStorage.setItem('user', JSON.stringify(response.data));
        console.log('✅ User object saved to localStorage');
        
        // IMPORTANT: Also save token separately for API calls
        localStorage.setItem('token', response.data.token);
        console.log('✅ JWT Token saved to localStorage with key "token"');
        console.log('Token value:', response.data.token.substring(0, 20) + '...');
        
        // Verify token was saved
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          console.log('✅ Token verification successful - Token is available for API calls');
        } else {
          console.error('❌ Token verification failed - Token not found in localStorage');
        }
      } else {
        console.warn('⚠️ No token in login response');
      }
      return response.data;
    })
    .catch((error) => {
      console.error('❌ Login error:', error);
      throw error;
    });
};

const logout = () => {
  console.log('🚪 Logging out user...');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  console.log('✅ User session cleared - Both user object and token removed');
};

const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      localStorage.removeItem('user');
      return null;
    }
    const user = JSON.parse(userStr);
    
    // Check if token exists and is valid
    if (user && user.token && typeof user.token === 'string') {
      // Decode the token to check expiration
      const decodedToken = jwtDecode(user.token);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp < currentTime) {
        // Token has expired
        localStorage.removeItem('user');
        return null;
      }
      return user;
    } else {
      localStorage.removeItem('user');
      return null;
    }
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const register = (username, email, password) => {
  return api.post('/auth/register', { username, email, password });
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default authService;