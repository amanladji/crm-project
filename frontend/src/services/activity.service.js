import api from './api';

// Helper function to get all activities
export const getAllActivities = async (token) => {
  try {
    console.log('📥 Fetching activities from backend...');
    console.log('🔗 API Base URL:', api.defaults.baseURL);
    console.log('🔗 Full Endpoint:', `${api.defaults.baseURL}/activities`);
    console.log('🔐 Authentication token present:', !!token);
    
    const response = await api.get('/activities');
    
    const data = response.data;
    console.log('📊 Raw API Response:', data);
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Type:', typeof data);
    console.log('📊 Is Array:', Array.isArray(data));
    
    // Validate and transform response to ensure it's an array
    let activities = [];
    if (Array.isArray(data)) {
      // Direct array response (new format) - PREFERRED
      activities = data;
      console.log('✅ Response is a direct array');
    } else if (data && typeof data === 'object') {
      // Check if data is wrapped in a property (fallback for old format)
      if (data.activities && Array.isArray(data.activities)) {
        activities = data.activities;
        console.log('✅ Extracted from data.activities property');
      } else if (data.content && Array.isArray(data.content)) {
        activities = data.content;
        console.log('✅ Extracted from data.content property');
      } else if (data.data && Array.isArray(data.data)) {
        activities = data.data;
        console.log('✅ Extracted from data.data property');
      } else {
        // If it's a single object, wrap it in array
        activities = [data];
        console.log('⚠️ Wrapped single object in array');
      }
    } else {
      // Invalid response format
      console.error('❌ Unexpected response format:', typeof data);
      activities = [];
    }
    
    console.log('✅ Activities fetched successfully:', activities.length, 'records');
    return activities;
  } catch (error) {
    console.error('❌ Error fetching activities:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Status:', error.response?.status);
    console.error('   Status text:', error.response?.statusText);
    console.error('   Response data:', error.response?.data);
    console.error('   Full error:', error);
    throw error;
  }
};

// Get activities for a specific lead
export const getActivitiesByLead = async (leadId, token) => {
  try {
    console.log(`📥 Fetching activities for lead ${leadId}...`);
    const response = await api.get(`/activities/lead/${leadId}`);
    
    const data = response.data;
    // Validate and transform response to ensure it's an array
    let activities = [];
    if (Array.isArray(data)) {
      activities = data;
    } else if (data && typeof data === 'object') {
      if (data.activities && Array.isArray(data.activities)) {
        activities = data.activities;
      } else if (data.content && Array.isArray(data.content)) {
        activities = data.content;
      } else if (data.data && Array.isArray(data.data)) {
        activities = data.data;
      } else {
        activities = [data];
      }
    }
    
    console.log(`✅ Activities fetched for lead ${leadId}:`, activities.length, 'records');
    return activities;
  } catch (error) {
    console.error(`❌ Error fetching activities for lead ${leadId}:`, error.message);
    throw error;
  }
};

// Get activities for a specific customer
export const getActivitiesByCustomer = async (customerId, token) => {
  try {
    console.log(`📥 Fetching activities for customer ${customerId}...`);
    const response = await api.get(`/activities/customer/${customerId}`);
    
    const data = response.data;
    let activities = [];
    if (Array.isArray(data)) {
      activities = data;
    } else if (data && typeof data === 'object') {
      if (data.activities && Array.isArray(data.activities)) {
        activities = data.activities;
      } else if (data.content && Array.isArray(data.content)) {
        activities = data.content;
      } else if (data.data && Array.isArray(data.data)) {
        activities = data.data;
      } else {
        activities = [data];
      }
    }
    
    console.log(`✅ Activities fetched for customer ${customerId}:`, activities.length, 'records');
    return activities;
  } catch (error) {
    console.error(`❌ Error fetching activities for customer ${customerId}:`, error.message);
    throw error;
  }
};

// Log a new activity
export const logActivity = async (activityData, token) => {
  try {
    console.log('📝 Creating new activity...');
    const response = await api.post('/activities', activityData);
    
    const data = response.data;
    console.log('✅ Activity created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error logging activity:', error.message);
    throw error;
  }
};
