import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import authService from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <Navbar title="Settings" />
        <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
            
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 relative">Profile Settings</h2>
            
            <div className="flex items-center gap-6 mb-8 relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{user?.username || 'User'}</h3>
                <p className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                  {user?.roles?.[0] || 'Administrator'}
                </p>
              </div>
            </div>

            <div className="space-y-5 relative">
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                 <input type="text" disabled value={user?.username || ''} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium opacity-70" />
              </div>
              {user?.email && (
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                   <input type="text" disabled value={user?.email || ''} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium opacity-70" />
                </div>
              )}
            </div>

            <div className="mt-12 border-t border-gray-100 pt-8 relative">
              <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Danger Zone
              </h3>
              <p className="text-sm text-gray-500 mb-6">Logging out will clear your current session securely from this device.</p>
              <button onClick={handleLogout} className="bg-white text-red-600 font-bold px-6 py-3 rounded-xl transition-all border border-red-200 shadow-sm hover:shadow-md hover:bg-red-50 hover:border-red-300">
                Log Out Securely
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;