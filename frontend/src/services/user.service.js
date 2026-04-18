import api from './api';

/**
 * User service - handles fetching current user information
 */
const getCurrentUser = () => {
  return api.get('/users/me');
};

const userService = {
  getCurrentUser,
};

export default userService;
