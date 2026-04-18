import api from './api';

export const getAllUsers = () => api.get('/users');
export const getConversationUsers = () => api.get('/users/conversations');
export const getConversationMessages = (userId) => api.get(`/chat/${userId}`);
export const sendMessage = (receiverId, content) => api.post('/chat/send', { receiverId, content });
export const startConversation = (userId) => api.post('/conversations', { userId }).catch(() => Promise.resolve({ data: {} }));
export const searchUsers = (query) => api.get('/users/search', { params: { query } });