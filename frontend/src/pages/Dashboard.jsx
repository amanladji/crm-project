import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getDashboardAnalytics } from '../services/analytics.service';

function Dashboard() {
  const [stats, setStats] = useState({ 
    totalCustomers: 0, 
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    totalActivities: 0,
    conversionRate: 0 
  });

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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Operations Hub</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">{stats.totalCustomers}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Leads Pipeline</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">{stats.totalLeads}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">New Leads</dt>
            <dd className="mt-1 text-3xl font-semibold text-orange-600">{stats.newLeads}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Converted Leads</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.convertedLeads}</dd>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
            <dd className="mt-1 text-3xl font-semibold text-purple-600">
              {Math.round(stats.conversionRate || 0)}%
            </dd>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${Math.round(stats.conversionRate || 0)}%` }}></div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-6 md:col-span-1">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Team Activities Logged</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalActivities}</dd>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;