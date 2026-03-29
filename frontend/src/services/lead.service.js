import api from './api';

export const getLeads = (page = 0, size = 10) => api.get(`/leads?page=${page}&size=${size}`);
export const searchLeads = (query, status, page = 0, size = 10) => {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (status) params.append('status', status);
  params.append('page', page);
  params.append('size', size);
  return api.get(`/leads/search?${params.toString()}`);
};
export const getLeadsByAssignee = (userId) => api.get(`/leads/assignee/${userId}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const updateLeadStatus = (id, status) => api.put(`/leads/${id}/status`, { status });
export const deleteLead = (id) => api.delete(`/leads/${id}`);
