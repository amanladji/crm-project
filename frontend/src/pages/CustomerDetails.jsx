import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCustomerById, getLeadsForCustomer, getActivitiesForCustomer, createActivity } from '../services/customer.service';
import authService from '../services/auth.service';

export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [leads, setLeads] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Activity form states
  const [activityType, setActivityType] = useState('CALL');
  const [activityDesc, setActivityDesc] = useState('');
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [activityError, setActivityError] = useState('');

  const fetchActivities = async () => {
    try {
      const res = await getActivitiesForCustomer(id);
      // Backend should sort them, but let's reverse them just in case to show latest first if not sorted
      // Actually let's assume backed sorting or do it here
      const sorted = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [customerRes, leadsRes, activitiesRes] = await Promise.all([
          getCustomerById(id),
          getLeadsForCustomer(id),
          getActivitiesForCustomer(id)
        ]);

        setCustomer(customerRes.data);
        setLeads(leadsRes.data);
        const sorted = activitiesRes.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivities(sorted);
      } catch (err) {
        console.error('Error fetching customer details:', err);
        setError(err.response?.data?.message || 'Failed to load customer details. They may have been deleted or the server is unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!activityDesc.trim()) {
      setActivityError('Description is required');
      return;
    }
    
    const user = authService.getCurrentUser();
    if (!user || (!user.id && !user.userId)) {
      setActivityError('User authentication failed. Please login again.');
      return;
    }

    try {
      setActivitySubmitting(true);
      setActivityError('');
      
      const payload = {
        type: activityType,
        description: activityDesc,
        customerId: parseInt(id),
        userId: user.id || user.userId
      };

      await createActivity(payload);
      
      // reset form
      setActivityType('CALL');
      setActivityDesc('');
      
      // refresh activities
      await fetchActivities();
    } catch (err) {
      console.error('Failed to log activity:', err);
      setActivityError(err.response?.data?.message || 'Failed to log activity.');
    } finally {
      setActivitySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center mt-10">Loading customer details...</div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-10" role="alert">
            <span className="block sm:inline">{error || 'Customer not found.'}</span>
          </div>
          <Link to="/customers" className="inline-block mt-4 text-indigo-600 hover:text-indigo-900">
            &larr; Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6 mb-4 flex">
          <Link to="/customers" className="text-indigo-600 hover:text-indigo-900 flex items-center">
            &larr; Back to Customers
          </Link>
        </div>
        
        {/* Customer Information Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Profile</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and basic information.</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.name}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.phone || 'N/A'}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.company || 'N/A'}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.address || 'N/A'}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Linked Leads Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Linked Leads</h3>
          </div>
          <div className="border-t border-gray-200">
            {leads.length === 0 ? (
              <div className="px-4 py-5 text-sm text-gray-500 italic">No leads found for this customer.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <li key={lead.id} className="px-4 py-4 sm:px-6 flex justify-between items-center bg-white hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-indigo-600">{lead.name}</div>
                      <div className="text-sm text-gray-500">Created: {new Date(lead.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.status === 'NEW' ? 'bg-green-100 text-green-800' :
                      lead.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'QUALIFIED' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'CONVERTED' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Add Activity Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Log Interaction</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form onSubmit={handleActivitySubmit} className="space-y-4">
              {activityError && (
                <div className="text-red-600 text-sm">{activityError}</div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    id="activityType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                  >
                    <option value="CALL">📞 CALL</option>
                    <option value="EMAIL">📧 EMAIL</option>
                    <option value="MEETING">📅 MEETING</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label htmlFor="activityDesc" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="activityDesc"
                    rows="2"
                    className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="E.g., Discussed pricing..."
                    value={activityDesc}
                    onChange={(e) => setActivityDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={activitySubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {activitySubmitting ? 'Saving...' : 'Log Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Activity Timeline Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Activity History</h3>
          </div>
          <div className="border-t border-gray-200">
            {activities.length === 0 ? (
              <div className="px-4 py-5 text-sm text-gray-500 italic">No activity recorded.</div>
            ) : (
              <div className="flow-root px-4 py-5 sm:px-6">
                <ul className="-mb-8">
                  {activities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== activities.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.type === 'CALL' ? 'bg-blue-100' :
                              activity.type === 'EMAIL' ? 'bg-green-100' :
                              activity.type === 'MEETING' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              <span className="text-xl">
                                {activity.type === 'CALL' && '📞'}
                                {activity.type === 'EMAIL' && '📧'}
                                {activity.type === 'MEETING' && '📅'}
                                {!['CALL', 'EMAIL', 'MEETING'].includes(activity.type) && '📝'}
                              </span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                <span className={`font-semibold mr-2 p-1 rounded ${
                                  activity.type === 'CALL' ? 'text-blue-800 bg-blue-50' :
                                  activity.type === 'EMAIL' ? 'text-green-800 bg-green-50' :
                                  activity.type === 'MEETING' ? 'text-purple-800 bg-purple-50' :
                                  'text-gray-800 bg-gray-50'
                                }`}>[{activity.type}]</span>
                                {activity.description}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={activity.timestamp}>{new Date(activity.timestamp).toLocaleString()}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}