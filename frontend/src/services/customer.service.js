import api from './api';

export const getCustomers = () => api.get('/customers');
export const searchCustomers = (query) => {
  if (!query) return getCustomers();
  return api.get(`/customers/search?query=${encodeURIComponent(query)}`);
};
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const getLeadsForCustomer = (id) => api.get(`/customers/${id}/leads`);
export const getActivitiesForCustomer = (id) => api.get(`/customers/${id}/activities`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
