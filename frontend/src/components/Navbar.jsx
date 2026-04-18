import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import authService from '../services/auth.service';
import notificationService from '../services/notification.service';
import userService from '../services/user.service';

function Navbar({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  
  // User profile state
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    // Poll for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      fetchNotifications();
    }
  }, [isDropdownOpen]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const fetchCurrentUser = async () => {
    setUserLoading(true);
    try {
      const response = await userService.getCurrentUser();
      console.log('Current user fetched:', response.data);
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setCurrentUser(null);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Remove from list and update count
      setNotifications(notifications.filter(n => n.id !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Convert pathname to Title Case if no explicit title is provided
  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname.split('/')[1];
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  /**
   * Format role enum to display text
   * ADMIN -> Administrator
   * USER -> User
   */
  const formatRole = (roleStr) => {
    if (!roleStr) return 'User';
    const roleMap = {
      'ADMIN': 'Administrator',
      'USER': 'User'
    };
    return roleMap[roleStr] || roleStr;
  };

  return (
    <nav className="bg-white h-16 border-b border-gray-200 sticky top-0 z-30 w-full flex items-center shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Left Side: Page Title */}
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">{getPageTitle()}</h2>
        </div>

        {/* Right Side: Profile & Actions */}
        <div className="flex items-center gap-4 relative">
          {/* Notification Bell Icon with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors relative"
              title="Notifications"
            >
              {/* Badge with unread count */}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {/* Bell Icon */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </button>

            {/* Notification Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 font-semibold">
                  Notifications
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                      </svg>
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer p-4 group"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 font-medium leading-snug">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-blue-500 mt-1"></span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
          
          {/* Profile Section with Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-800 leading-none">
                  {currentUser?.username || user?.username || 'Loading...'}
                </span>
                <span className="text-xs text-gray-500 font-medium mt-1">
                  {currentUser ? formatRole(currentUser.role) : 'User'}
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white cursor-pointer">
                {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'G')}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                {/* Header with user info */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                      {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {currentUser?.username || 'User'}
                      </p>
                      <p className="text-xs text-blue-100">
                        {currentUser ? formatRole(currentUser.role) : 'User'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="py-1 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;