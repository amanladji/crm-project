import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getDashboardAnalytics } from '../services/analytics.service';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    totalCustomers: 0, 
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    totalActivities: 0,
    conversionRate: 0 
  });

  // Campaign modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDashboardAnalytics();
        setStats(response.data);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      }
    };
    fetchData();
  }, []);

  // Handle opening modal
  const handleOpenModal = async () => {
    console.log('🔹 Opening campaign modal...');
    setIsModalOpen(true);
    setCampaignName('');
    setDescription('');
    setCampaignMessage('');
    setMessage('');
    setSelectedUsers([]);
    
    // Fetch users from backend
    setUsersLoading(true);
    try {
      // Get token from user object stored in localStorage
      const userStr = localStorage.getItem('user');
      let token = null;
      if (userStr) {
        const user = JSON.parse(userStr);
        token = user.token;
      }
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await fetch('http://localhost:8081/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Users fetched from API:', data);
      console.log('Users count:', data.length);
      if (data.length > 0) console.log('First user:', data[0]);
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Error fetching users:', error.message);
      console.error('Full error:', error);
      setUsers([]);
      setMessage(error.message || 'Failed to fetch users');
      setMessageType('error');
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCampaignName('');
    setDescription('');
    setCampaignMessage('');
    setMessage('');
    setSelectedUsers([]);
  };

  // Handle View All button click - Navigate to Activity Page
  const handleViewAllClick = () => {
    console.log('🧭 Navigating to Activity Page...');
    console.log('Current route:', window.location.pathname);
    console.log('Target route: /activity');
    navigate('/activity');
    console.log('✅ Navigation initiated to /activity');
  };

  // Handle user selection
  const handleUserToggle = (userId) => {
    console.log('User toggled:', userId);
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      console.log('Updated selectedUsers:', newSelection);
      return newSelection;
    });
  };

  // Handle creating campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    console.log('📝 Form submitted');
    console.log('Campaign Name:', campaignName);
    console.log('Selected Users:', selectedUsers);

    // Frontend validation
    if (!campaignName.trim()) {
      console.warn('Campaign name is empty');
      setMessage('Campaign name is required');
      setMessageType('error');
      return;
    }

    if (!campaignMessage.trim()) {
      console.warn('Campaign message is empty');
      setMessage('Campaign message is required');
      setMessageType('error');
      return;
    }

    if (selectedUsers.length === 0) {
      console.warn('No users selected');
      setMessage('Please select at least one user');
      setMessageType('error');
      return;
    }

    console.log('✓ All frontend validation passed');
    setLoading(true);
    setMessage('');

    try {
      // Get token from user object stored in localStorage
      const userStr = localStorage.getItem('user');
      let token = null;
      if (userStr) {
        const user = JSON.parse(userStr);
        token = user.token;
      }
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Step 1: Create campaign
      console.log('📤 Sending campaign creation request');
      const campaignPayload = {
        name: campaignName.trim(),
        description: description.trim(),
        message: campaignMessage.trim(),
        userIds: selectedUsers
      };
      console.log('Campaign payload:', campaignPayload);
      
      const createResponse = await fetch('http://localhost:8081/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campaignPayload)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Campaign creation failed:', errorText);
        throw new Error('Failed to create campaign');
      }

      const campaignData = await createResponse.json();
      console.log('✓ Campaign created:', campaignData);

      // Step 2: Send campaign messages
      console.log('📨 Sending campaign messages');
      setMessage('Campaign created! Sending messages...');
      setMessageType('success');

      const sendResponse = await fetch('http://localhost:8081/api/campaigns/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          campaignId: campaignData.id
        })
      });

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        console.error('Send message failed:', errorText);
        throw new Error('Failed to send campaign messages');
      }

      const sendData = await sendResponse.json();
      console.log('✓ Campaign messages sent:', sendData);

      setMessage(`Campaign sent successfully to ${sendData.successCount} user(s)!`);
      setMessageType('success');
      
      // Reset form and close modal after 2 seconds
      setTimeout(() => {
        setCampaignName('');
        setDescription('');
        setCampaignMessage('');
        setIsModalOpen(false);
        setMessage('');
        setSelectedUsers([]);
      }, 1500);
    } catch (error) {
      console.error('Error creating/sending campaign:', error);
      setMessage(error.message || 'Failed to create or send campaign');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <Navbar title="Dashboard" />
        
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Here's what's happening in your account today.</p>
              </div>
              <div className="flex space-x-3">
                <button className="bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl text-sm shadow-sm hover:bg-gray-50 flex items-center transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Select date range
                </button>
                <button 
                  onClick={handleOpenModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-md shadow-blue-500/20 transition-colors flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  New Campaign
                </button>
              </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Users</p>
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></span>
                </div>
                <div className="mt-4 flex items-baseline">
                  <p className="text-4xl font-extrabold text-gray-900">{stats.totalCustomers || 142}</p>
                  <p className="ml-2 text-sm font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    12%
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Conversations</p>
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg></span>
                </div>
                <div className="mt-4 flex items-baseline">
                  <p className="text-4xl font-extrabold text-gray-900">{stats.totalLeads || 8.6}k</p>
                  <p className="ml-2 text-sm font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    24%
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Messages Sent</p>
                  <span className="p-2 bg-orange-50 text-orange-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></span>
                </div>
                <div className="mt-4 flex items-baseline">
                  <p className="text-4xl font-extrabold text-gray-900">{stats.newLeads || 45}k</p>
                  <p className="ml-2 text-sm font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    8%
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Rate</p>
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></span>
                </div>
                <div className="mt-4 flex items-baseline">
                  <p className="text-4xl font-extrabold text-gray-900">{Math.round(stats.conversionRate || 68)}%</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style={{ width: `${Math.round(stats.conversionRate || 68)}%` }}></div>
                </div>
              </div>
              
            </div>

            {/* Bottom Section - Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               
               {/* Activity Section */}
               <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
                   <h2 className="text-lg font-bold text-gray-900">Recent User Activity</h2>
                   <button 
                     onClick={handleViewAllClick}
                     className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
                     title="View all activities"
                   >
                     View All
                   </button>
                 </div>
                 <div className="divide-y divide-gray-50">
                    {/* Dummy Data Rows */}
                    {[
                      { id: 1, name: 'Michael Chen', action: 'Resolved support ticket #829', time: '10 mins ago', status: 'Completed', color: 'green' },
                      { id: 2, name: 'Sarah Wilson', action: 'Sent mass campaign to 500 users', time: '1 hr ago', status: 'Processing', color: 'blue' },
                      { id: 3, name: 'David Smith', action: 'Logged a call with ACME Corp', time: '3 hrs ago', status: 'Logged', color: 'purple' },
                      { id: 4, name: 'Jessica Lee', action: 'Failed to complete payment transaction', time: '5 hrs ago', status: 'Failed', color: 'red' },
                    ].map(activity => (
                      <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full bg-${activity.color}-100 flex items-center justify-center text-${activity.color}-600 font-bold text-sm`}>
                            {activity.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-gray-900">{activity.name}</p>
                             <p className="text-sm text-gray-500 mt-0.5">{activity.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-gray-400 font-medium mb-1">{activity.time}</p>
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-${activity.color}-50 text-${activity.color}-700`}>
                             {activity.status}
                           </span>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>

                {/* Right Mini Widget */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl shadow-sm overflow-hidden relative p-8">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 -mx-8 -my-8 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 -mx-8 -my-8 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
                  
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <span className="bg-indigo-500/30 text-indigo-200 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block border border-indigo-400/20">Pro Tip</span>
                      <h3 className="text-xl font-bold text-white mt-4 leading-snug">Boost response rates by 40%</h3>
                      <p className="text-indigo-200 mt-3 text-sm leading-relaxed">Schedule your automated outgoing messages between 10 AM and 11 AM local time to maximize engagement.</p>
                    </div>
                    
                    <button className="mt-8 w-full bg-white text-indigo-900 font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all text-sm">
                      Read the case study
                    </button>
                  </div>
                </div>

            </div>

          </div>
        </main>

        {/* Campaign Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
              {/* Modal Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create New Campaign</h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6">
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  {/* Campaign Name Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Campaign Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter campaign description"
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Campaign Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={campaignMessage}
                      onChange={(e) => setCampaignMessage(e.target.value)}
                      placeholder="Write your campaign message..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {campaignMessage.length} / 1000 characters
                    </p>
                  </div>

                  {/* Select Users Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Users <span className="text-red-500">*</span>
                    </label>
                    {usersLoading ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Loading users...</p>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No users available</p>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto bg-gray-50">
                        {users.map(user => (
                          <div key={user.id} className="flex items-center mb-3">
                            <input
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleUserToggle(user.id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor={`user-${user.id}`} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer flex-1">
                              {user.username}
                              <span className="text-gray-500 text-xs ml-1">({user.email})</span>
                            </label>
                          </div>
                        ))}
                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                          {selectedUsers.length} user(s) selected
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Message Display */}
                  {message && (
                    <div className={`p-3 rounded-lg text-sm font-medium ${
                      messageType === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {message}
                    </div>
                  )}

                  {/* Modal Footer */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Create Campaign'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;