import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, searchCustomers } from '../services/customer.service';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', address: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setCurrentPage(0); // Reset to page 0 globally when a search query is changed
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomersList();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  const fetchCustomersList = async () => {
    setLoading(true);
    try {
      const response = await searchCustomers(searchQuery, currentPage, 10);
      setCustomers(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = () => {
    fetchCustomersList();
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', company: '', address: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        alert('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (editingId) {
        await updateCustomer(editingId, formData);
        alert('Customer updated successfully');
      } else {
        await createCustomer(formData);
        alert('Customer created successfully');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      if (error.response?.status === 400 && error.response?.data && typeof error.response.data === 'object' && !error.response.data.message) {
        setErrors(error.response.data);
      } else {
        alert(error.response?.data?.message || 'Failed to save customer');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <button
                onClick={openAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 whitespace-nowrap"
              >
                Add Customer
              </button>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
              <div className="bg-white p-8 rounded-md shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-red-500' : ''}`} />
                    {errors.name && <p className="text-red-500 text-xs italic mt-1">{errors.name}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? 'border-red-500' : ''}`} />
                    {errors.email && <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.phone ? 'border-red-500' : ''}`} />
                    {errors.phone && <p className="text-red-500 text-xs italic mt-1">{errors.phone}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Company</label>
                    <input type="text" name="company" value={formData.company} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                  </div>
                  <div className="flex items-center justify-end space-x-4">
                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : customers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No customers found.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-blue-600 truncate hover:underline cursor-pointer" onClick={() => window.location.href = `/customers/${customer.id}`}>
                          {customer.name}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {customer.company || 'N/A'}
                          </span>
                          <button onClick={() => openEditModal(customer)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-600 rounded px-2 py-1 text-xs">Edit</button>
                          <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900 border border-red-600 rounded px-2 py-1 text-xs">Delete</button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {customer.email}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            {customer.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Pagination Controls */}
            {!loading && customers.length > 0 && (
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

export default Customers;
