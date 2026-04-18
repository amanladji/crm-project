import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getAllActivities } from '../services/activity.service';

function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch activities on component mount
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch activities from backend
        const data = await getAllActivities(token);
        
        // DEBUG: Log API response
        console.log('🔍 DEBUG - API Response received:', data);
        console.log('🔍 DEBUG - Is Array:', Array.isArray(data));
        console.log('🔍 DEBUG - Response Type:', typeof data);
        
        // SAFETY CHECK: Ensure data is an array before calling .map()
        if (!Array.isArray(data)) {
          console.error('❌ ERROR: Invalid activities data - expected array, got:', typeof data, data);
          setActivities([]);
          setError('Invalid data format received from server');
          return;
        }
        
        // Transform API response to component format
        const transformedActivities = data.map((activity) => {
          const username = activity.performedBy?.username || 'Unknown';
          const initials = username.substring(0, 2).toUpperCase();
          const avatarColors = {
            'admin': 'bg-blue-500',
            'aman': 'bg-blue-500',
            'ahmed': 'bg-green-500',
            'sarah': 'bg-purple-500',
            'masroor': 'bg-red-500'
          };
          const avatarColor = avatarColors[username.toLowerCase()] || 'bg-gray-500';

          // Create action description
          let action = activity.description || 'Activity recorded';
          if (activity.customer) {
            action += ` - ${activity.customer.name}`;
          }

          // Format timestamp
          const activityTime = new Date(activity.timestamp);
          const now = new Date();
          const diffMs = now - activityTime;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          let timestamp = 'Just now';
          if (diffMins > 0 && diffMins < 60) {
            timestamp = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
          } else if (diffHours > 0 && diffHours < 24) {
            timestamp = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          } else if (diffDays > 0) {
            timestamp = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
          }

          return {
            id: activity.id,
            user: username.charAt(0).toUpperCase() + username.slice(1),
            action: action,
            type: activity.type || 'ACTIVITY',
            status: 'completed', // Default status from backend
            timestamp: timestamp,
            initials: initials,
            avatarColor: avatarColor,
            customer: activity.customer,
            lead: activity.lead,
            performedBy: activity.performedBy
          };
        });

        setActivities(transformedActivities);
        setError(null);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities. Please try again later.');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getStatusBadge = (status) => {
    const config = {
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Processing' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' }
    };
    return config[status] || config.completed;
  };

  const getTypeInfo = (type) => {
    const config = {
      CAMPAIGN: { icon: '📧', color: 'text-blue-600' },
      LOGIN: { icon: '🔐', color: 'text-green-600' },
      CUSTOMER: { icon: '👥', color: 'text-purple-600' },
      LEAD: { icon: '📊', color: 'text-orange-600' },
      MESSAGE: { icon: '💬', color: 'text-pink-600' }
    };
    return config[type] || { icon: '📝', color: 'text-gray-600' };
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <Navbar title="Activities" />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">All Activities</h1>
                <p className="text-gray-600 mt-2">Track all user actions and events in your system</p>
              </div>
              <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
                Filter
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                <div className="inline-block">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading activities...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <div className="flex items-start gap-4">
                  <div className="text-red-600 text-2xl">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-red-900">Error Loading Activities</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && activities.length === 0 && (
              <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
                <p className="text-gray-600">There are no activities to display at this time.</p>
              </div>
            )}

            {/* Activities List */}
            {!loading && !error && activities.length > 0 && (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const badge = getStatusBadge(activity.status);
                  const typeInfo = getTypeInfo(activity.type);
                  return (
                    <div key={activity.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${activity.avatarColor} flex items-center justify-center`}>
                          <span className="text-white font-bold">{activity.initials}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                              {activity.user}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{activity.action}</p>
                          <div className="flex items-center gap-3">
                            <span className={`text-lg ${typeInfo.color}`}>{typeInfo.icon}</span>
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
                              {activity.type}
                            </span>
                            <span className="text-gray-500 text-xs ml-auto">{activity.timestamp}</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {!loading && !error && activities.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Showing {activities.length} activities</p>
                    <p className="text-xs text-gray-500 mt-1">Updated in real-time</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" disabled>
                      Previous
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ActivityPage;
