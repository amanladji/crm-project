import api from './api';

export const getCustomers = (page = 0, size = 10) => api.get(`/customers?page=${page}&size=${size}`);
export const searchCustomers = (query, page = 0, size = 10) => {
  if (!query) return getCustomers(page, size);
  return api.get(`/customers/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
};
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const getLeadsForCustomer = (id) => api.get(`/customers/${id}/leads`);
export const getActivitiesForCustomer = (id) => api.get(`/customers/${id}/activities`);
export const createActivity = (data) => api.post('/activities', data);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
