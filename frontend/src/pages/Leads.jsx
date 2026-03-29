import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getLeads, createLead, updateLead, deleteLead, updateLeadStatus, searchLeads } from '../services/lead.service';
import { getCustomers } from '../services/customer.service';

function Leads() {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', status: 'NEW', customerId: '' });
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, customRes] = await Promise.all([searchLeads(searchQuery, statusFilter, currentPage, 10), getCustomers(0, 100)]);
      setLeads(leadsRes.data.content);
      setTotalPages(leadsRes.data.totalPages);
      setCustomers(customRes.data.content || customRes.data); // Keep backwards compatibility if ever needed
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await searchLeads(searchQuery, statusFilter, currentPage, 10);
      setLeads(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', company: '', status: 'NEW', customerId: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (lead) => {
    setEditingId(lead.id);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      status: lead.status || 'NEW',
      customerId: lead.customer?.id || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await deleteLead(id);
        alert('Lead deleted successfully');
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('Failed to delete lead');
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Title is required';
    if (!formData.status) newErrors.status = 'Status is required';
    if (!formData.customerId) newErrors.customerId = 'Customer is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (editingId) {
        await updateLead(editingId, formData);
        alert('Lead updated successfully');
      } else {
        await createLead(formData);
        alert('Lead created successfully');
      }
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      if (error.response?.status === 400 && error.response?.data && typeof error.response.data === 'object' && !error.response.data.message) {
        setErrors(error.response.data);
      } else {
        alert(error.response?.data?.message || 'Failed to save lead');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateLeadStatus(id, newStatus);
      fetchLeads();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update lead status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Search by name/company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="LOST">LOST</option>
              </select>
              <button 
                onClick={openAddModal}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 whitespace-nowrap"
              >
                Add Lead
              </button>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
              <div className="bg-white p-8 rounded-md shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Lead' : 'Add New Lead'}</h2>        
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-red-500' : ''}`} />
                    {errors.name && <p className="text-red-500 text-xs italic mt-1">{errors.name}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Company</label>
                    <input type="text" name="company" value={formData.company} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Customer *</label>
                    <select name="customerId" value={formData.customerId} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.customerId ? 'border-red-500' : ''}`}>
                      <option value="">Select Customer</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>{cust.name}</option>
                      ))}
                    </select>
                    {errors.customerId && <p className="text-red-500 text-xs italic mt-1">{errors.customerId}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Status *</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.status ? 'border-red-500' : ''}`}>
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="LOST">Lost</option>
                    </select>
                    {errors.status && <p className="text-red-500 text-xs italic mt-1">{errors.status}</p>}
                  </div>
                  <div className="flex items-center justify-end space-x-4">
                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : leads.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No leads found.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <li key={lead.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          {lead.name}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className="text-xs leading-5 font-semibold rounded-full border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-gray-800 px-2 py-1"
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="QUALIFIED">QUALIFIED</option>
                            <option value="CONVERTED">CONVERTED</option>
                            <option value="LOST">LOST</option>
                          </select>
                          <button onClick={() => openEditModal(lead)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-600 rounded px-2 py-1 text-xs">Edit</button>
                          <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:text-red-900 border border-red-600 rounded px-2 py-1 text-xs">Delete</button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {lead.email}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            {lead.phone || 'No phone'}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6 font-semibold">
                            Customer: {lead.customer?.name || 'Unlinked'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Pagination Controls */}
            {!loading && leads.length > 0 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${currentPage === 0 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${currentPage >= totalPages - 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing Page <span className="font-medium">{currentPage + 1}</span> of <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Previous</span>
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage >= totalPages - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <span className="sr-only">Next</span>
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Leads;
