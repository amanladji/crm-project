import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

function Navbar() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">CRM System</Link>
            <div className="hidden md:block ml-10 flex space-x-4">
              <Link to="/customers" className="px-3 py-2 rounded-md hover:bg-gray-700">Customers</Link>
              <Link to="/leads" className="px-3 py-2 rounded-md hover:bg-gray-700">Leads</Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, {user?.username}</span>
            <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;