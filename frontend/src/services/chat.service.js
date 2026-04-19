import api from './api';

// ========== EXISTING APIs ==========
export const getAllUsers = () => api.get('/users');
export const getConversationUsers = () => api.get('/users/conversations');
export const getConversationMessages = (userId) => api.get(`/chat/${userId}`);
export const sendMessage = (receiverId, content) => api.post('/chat/send', { receiverId, content });
export const startConversation = (userId) => api.post('/conversations', { userId }).catch(() => Promise.resolve({ data: {} }));
export const searchUsers = (query) => api.get('/users/search', { params: { query } });

// ========== NEW: CHAT INVITATION SYSTEM ==========

/**
 * Send a chat invitation to another user
 * POST /api/chat/invite
 * 
 * @param {number} receiverId - ID of user to invite
 * @returns {Promise} - ChatRequest object with id, sender, receiver, status
 */
export const sendInvitation = (receiverId) => {
  console.log('📤 chat.service: Sending invitation to user ID', receiverId);
  return api.post('/chat/invite', { receiverId });
};

/**
 * Get all pending chat requests for current user
 * GET /api/chat/requests
 * 
 * @returns {Promise} - List of pending requests with sender details
 */
export const getPendingRequests = () => {
  console.log('📥 chat.service: Fetching pending requests');
  return api.get('/chat/requests');
};

/**
 * Accept a chat invitation
 * POST /api/chat/accept/{id}
 * 
 * @param {number} requestId - ID of ChatRequest to accept
 * @returns {Promise} - Accepted ChatRequest object
 */
export const acceptInvitation = (requestId) => {
  console.log('✅ chat.service: Accepting invitation ID', requestId);
  return api.post(`/chat/accept/${requestId}`);
};

/**
 * Reject a chat invitation
 * POST /api/chat/reject/{id}
 * 
 * @param {number} requestId - ID of ChatRequest to reject
 * @returns {Promise} - Success message
 */
export const rejectInvitation = (requestId) => {
  console.log('❌ chat.service: Rejecting invitation ID', requestId);
  return api.post(`/chat/reject/${requestId}`);
};

/**
 * Get all accepted chat connections for current user
 * Only returns users where status = ACCEPTED
 * 
 * GET /api/chat/accepted-users
 * 
 * @returns {Promise} - List of accepted chat users
 */
export const getAcceptedUsers = () => {
  console.log('🔗 chat.service: Fetching accepted users');
  return api.get('/chat/accepted-users');
};