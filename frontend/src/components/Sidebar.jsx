import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: 'chart-pie' },
    { name: 'Chats', path: '/chat', icon: 'chat-bubble-left-right' },
    { name: 'Users', path: '/customers', icon: 'users' },
    { name: 'Leads', path: '/leads', icon: 'user-plus' },
    { name: 'Activities', path: '/activity', icon: 'activity' },
    { name: 'Settings', path: '/settings', icon: 'cog-6-tooth' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex-shrink-0 hidden md:flex flex-col min-h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 bg-gray-900 border-b border-gray-800">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Focus CRM<span className="text-blue-500">.</span></h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main Menu</p>
        {menuItems.map((item) => {
          const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <span className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {/* Fallback dummy icon generic shape */}
                <div className={`w-4 h-4 rounded-sm border-2 ${isActive ? 'border-white bg-blue-500' : 'border-gray-500 group-hover:border-gray-300'}`}></div>
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800 rounded-xl p-4 text-sm font-medium text-blue-400 text-center hover:bg-gray-700 cursor-pointer transition-colors">
          Upgrade to Pro
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;