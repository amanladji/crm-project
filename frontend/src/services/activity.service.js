const API_BASE_URL = 'http://localhost:8081/api/activities';

// Helper function to make authenticated requests
const fetchWithAuth = async (url, token, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Get all activities (sorted by newest first)
export const getAllActivities = async (token) => {
  try {
    console.log('📥 Fetching activities from backend...');
    const data = await fetchWithAuth(API_BASE_URL, token);
    
    // DEBUG: Log raw response
    console.log('📊 Raw API Response:', data);
    console.log('📊 Response Type:', typeof data);
    console.log('📊 Is Array:', Array.isArray(data));
    
    // Validate and transform response to ensure it's an array
    let activities = [];
    if (Array.isArray(data)) {
      activities = data;
    } else if (data && typeof data === 'object') {
      // Check if data is wrapped in a property
      if (data.activities && Array.isArray(data.activities)) {
        activities = data.activities;
      } else if (data.content && Array.isArray(data.content)) {
        activities = data.content;
      } else if (data.data && Array.isArray(data.data)) {
        activities = data.data;
      } else {
        // If it's a single object, wrap it in array
        activities = [data];
      }
    }
    
    console.log('✅ Activities fetched successfully:', activities.length, 'records');
    return activities;
  } catch (error) {
    console.error('❌ Error fetching activities:', error.message);
    throw error;
  }
};

// Get activities for a specific lead
export const getActivitiesByLead = async (leadId, token) => {
  try {
    console.log(`📥 Fetching activities for lead ${leadId}...`);
    const data = await fetchWithAuth(`${API_BASE_URL}/lead/${leadId}`, token);
    
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
    const data = await fetchWithAuth(`${API_BASE_URL}/customer/${customerId}`, token);
    console.log(`✅ Activities fetched for customer ${customerId}:`, data.length, 'records');
    return data;
  } catch (error) {
    console.error(`❌ Error fetching activities for customer ${customerId}:`, error.message);
    throw error;
  }
};

// Log a new activity
export const logActivity = async (activityData, token) => {
  try {
    console.log('📝 Creating new activity...');
    const data = await fetchWithAuth(API_BASE_URL, token, {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
    console.log('✅ Activity created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error logging activity:', error.message);
    throw error;
  }
};
