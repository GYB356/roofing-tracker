import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut, FiMoon, FiSun, FiSettings } from 'react-icons/fi';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsNotificationsOpen(false);
      setIsProfileOpen(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  
  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);
  
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/unread', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadNotifications(data.count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleNotifications = (e) => {
    e.stopPropagation();
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsProfileOpen(false);
  };
  
  const toggleProfile = (e) => {
    e.stopPropagation();
    setIsProfileOpen(!isProfileOpen);
    setIsNotificationsOpen(false);
  };
  
  const markNotificationAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      // Update local state
      setNotifications(notifications.filter(n => n._id !== id));
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  className="h-8 w-auto"
                  src={logo}
                  alt="HealthcareSync Logo"
                />
                <span className="ml-2 text-xl font-bold text-primary-600 dark:text-primary-400">
                  HealthcareSync
                </span>
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {isAuthenticated && (
                <>
                  <Link
                    to="/"
                    className={`${
                      location.pathname === '/'
                        ? 'border-primary-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Dashboard
                  </Link>
                  
                  <Link
                    to="/appointments"
                    className={`${
                      location.pathname.startsWith('/appointments')
                        ? 'border-primary-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Appointments
                  </Link>
                  
                  <Link
                    to="/medical-records"
                    className={`${
                      location.pathname.startsWith('/medical-records')
                        ? 'border-primary-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Records
                  </Link>
                  
                  <Link
                    to="/messages"
                    className={`${
                      location.pathname.startsWith('/messages')
                        ? 'border-primary-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Messages
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Right side icons */}
          <div className="flex items-center">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            
            {isAuthenticated ? (
              <>
                {/* Connection status indicator */}
                <div className="ml-3 flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      connected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={connected ? 'Connected' : 'Disconnected'}
                  ></div>
                </div>
                
                {/* Notifications */}
                <div className="ml-3 relative">
                  <button
                    onClick={toggleNotifications}
                    className="p-1 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    aria-label="View notifications"
                  >
                    <FiBell size={20} />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs text-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications dropdown */}
                  {isNotificationsOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          <span className="font-bold">Notifications</span>
                        </div>
                        
                        {notifications.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 cursor-pointer"
                              onClick={() => markNotificationAsRead(notification._id)}
                            >
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {notification.message}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
                        
                        <Link
                          to="/notifications"
                          className="block px-4 py-2 text-sm text-center text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Profile dropdown */}
                <div className="ml-3 relative">
                  <button
                    onClick={toggleProfile}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    {user?.profileImage ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.profileImage}
                        alt={user.fullName || 'User profile'}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-200">
                        <FiUser size={16} />
                      </div>
                    )}
                  </button>
                  
                  {/* Profile dropdown menu */}
                  {isProfileOpen && (
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                          <div className="font-medium">{user?.fullName || `${user?.firstName} ${user?.lastName}`}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </div>
                        </div>
                        
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          role="menuitem"
                        >
                          Your Profile
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          role="menuitem"
                        >
                          Settings
                        </Link>
                        
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          role="menuitem"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="ml-6 flex items-center">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Sign up
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden ml-3">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`${
                    location.pathname === '/'
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Dashboard
                </Link>
                
                <Link
                  to="/appointments"
                  className={`${
                    location.pathname.startsWith('/appointments')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Appointments
                </Link>
                
                <Link
                  to="/medical-records"
                  className={`${
                    location.pathname.startsWith('/medical-records')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Records
                </Link>
                
                <Link
                  to="/messages"
                  className={`${
                    location.pathname.startsWith('/messages')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Messages
                </Link>
                
                <Link
                  to="/profile"
                  className={`${
                    location.pathname.startsWith('/profile')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Profile
                </Link>
                
                <Link
                  to="/settings"
                  className={`${
                    location.pathname.startsWith('/settings')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="space-y-1 px-3 py-2">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center mt-2 px-4 py-2 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 