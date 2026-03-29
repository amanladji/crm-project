import api from './api';

export const getLeads = () => api.get('/leads');
export const searchLeads = (query, status) => {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (status) params.append('status', status);
  if (params.toString()) {
    return api.get(`/leads/search?${params.toString()}`);
  }
  return getLeads();
};
export const getLeadsByAssignee = (userId) => api.get(`/leads/assignee/${userId}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const updateLeadStatus = (id, status) => api.put(`/leads/${id}/status`, { status });
export const deleteLead = (id) => api.delete(`/leads/${id}`);
