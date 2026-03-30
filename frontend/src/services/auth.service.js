import api from './api';

const login = (username, password) => {
  return api.post('/auth/login', { username, password })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      localStorage.removeItem('user');
      return null;
    }
    const user = JSON.parse(userStr);
    if (user && user.token && typeof user.token === 'string') {
      return user;
    } else {
      localStorage.removeItem('user');
      return null;
    }
  } catch (e) {
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