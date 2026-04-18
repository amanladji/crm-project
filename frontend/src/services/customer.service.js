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

export const createCustomer = (data) => {
  // Ensure only valid fields are sent to backend
  const payload = {
    name: data.name?.trim() || '',
    email: data.email?.trim() || '',
    phone: data.phone?.trim() || '',
    company: data.company?.trim() || '',
    address: data.address?.trim() || ''
  };
  
  console.log('📤 Creating customer with payload:', JSON.stringify(payload, null, 2));
  
  return api.post('/customers', payload)
    .then(response => {
      console.log('✅ Customer created successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('❌ Failed to create customer:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    });
};

export const updateCustomer = (id, data) => {
  const payload = {
    name: data.name?.trim() || '',
    email: data.email?.trim() || '',
    phone: data.phone?.trim() || '',
    company: data.company?.trim() || '',
    address: data.address?.trim() || ''
  };
  
  console.log(`📤 Updating customer ${id} with payload:`, JSON.stringify(payload, null, 2));
  
  return api.put(`/customers/${id}`, payload)
    .then(response => {
      console.log(`✅ Customer ${id} updated successfully:`, response.data);
      return response;
    })
    .catch(error => {
      console.error(`❌ Failed to update customer ${id}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    });
};

export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
