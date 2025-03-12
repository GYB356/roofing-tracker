import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  UserIcon,
  ClipboardListIcon,
  CreditCardIcon,
  ChatIcon,
  CogIcon,
  LogoutIcon,
  MenuIcon,
  XIcon,
  BellIcon,
  VideoCameraIcon,
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon
} from '@heroicons/react/outline';

const DashboardLayout = ({ children }) => {
  const { currentUser, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Determine active menu item
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Menu items based on user role
  const getNavItems = () => {
    const commonItems = [
      { name: 'Dashboard', path: '/', icon: HomeIcon },
      { name: 'Appointments', path: '/appointments', icon: CalendarIcon },
    ];
    
    // Patient-specific menu items
    if (hasRole('PATIENT')) {
      return [
        ...commonItems,
        { name: 'Medical Records', path: '/medical-records', icon: ClipboardListIcon },
        { name: 'Billing', path: '/billing', icon: CreditCardIcon },
        { name: 'Messages', path: '/messages', icon: ChatIcon },
        { name: 'Telemedicine', path: '/telemedicine', icon: VideoCameraIcon },
        { name: 'Health Metrics', path: '/health-metrics', icon: ChartBarIcon },
      ];
    }
    
    // Doctor-specific menu items
    if (hasRole('DOCTOR')) {
      return [
        ...commonItems,
        { name: 'Patients', path: '/patients', icon: UsersIcon },
        { name: 'Medical Records', path: '/medical-records', icon: ClipboardListIcon },
        { name: 'Messages', path: '/messages', icon: ChatIcon },
        { name: 'Telemedicine', path: '/telemedicine', icon: VideoCameraIcon },
      ];
    }
    
    // Admin-specific menu items
    if (hasRole('ADMIN')) {
      return [
        ...commonItems,
        { name: 'Patients', path: '/patients', icon: UsersIcon },
        { name: 'Staff', path: '/staff', icon: UserGroupIcon },
        { name: 'Medical Records', path: '/medical-records', icon: ClipboardListIcon },
        { name: 'Billing', path: '/billing', icon: CreditCardIcon },
        { name: 'Analytics', path: '/analytics', icon: ChartBarIcon },
        { name: 'Settings', path: '/settings', icon: CogIcon },
      ];
    }
    
    // Nurse-specific menu items
    if (hasRole('NURSE')) {
      return [
        ...commonItems,
        { name: 'Patients', path: '/patients', icon: UsersIcon },
        { name: 'Medical Records', path: '/medical-records', icon: ClipboardListIcon },
        { name: 'Messages', path: '/messages', icon: ChatIcon },
      ];
    }
    
    // Staff-specific menu items
    if (hasRole('STAFF')) {
      return [
        ...commonItems,
        { name: 'Patients', path: '/patients', icon: UsersIcon },
        { name: 'Billing', path: '/billing', icon: CreditCardIcon },
        { name: 'Messages', path: '/messages', icon: ChatIcon },
      ];
    }
    
    // Default items for any role
    return commonItems;
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Generate initial avatar text
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name[0];
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 flex z-40 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`} 
        role="dialog" 
        aria-modal="true"
      >
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        ></div>
        
        {/* Sidebar */}
        <div 
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white focus:outline-none transform transition ease-in-out duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Close button */}
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          {/* Logo and navigation */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Link to="/" className="text-xl font-bold text-blue-600">
                HealthcareSync
              </Link>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {getNavItems().map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-6 w-6 ${
                      isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User profile */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600">
                    <span className="font-medium text-white">
                      {getInitials(currentUser?.fullName)}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700">
                    {currentUser?.fullName}
                  </p>
                  <p className="text-sm font-medium text-gray-500">
                    {currentUser?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 flex items-center text-sm font-medium text-red-600 hover:text-red-700"
              >
                <LogoutIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Force sidebar to shrink to fit close icon */}
        </div>
      </div>
      
      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        {/* Logo */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
          <Link to="/" className="text-xl font-bold text-blue-600">
            HealthcareSync
          </Link>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {getNavItems().map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* User profile */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600">
                  <span className="font-medium text-white">
                    {getInitials(currentUser?.fullName)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {currentUser?.fullName}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  {currentUser?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center text-xs font-medium text-red-600 hover:text-red-700"
            >
              <LogoutIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          {/* Mobile menu button */}
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          {/* Header content */}
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Page title could go here */}
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification dropdown */}
              <div className="ml-3 relative">
                <button
                  type="button"
                  className="relative p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {/* Notification badge */}
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>
                
                {/* Notification dropdown panel */}
                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {/* Example notifications */}
                      <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">Appointment Reminder</p>
                        <p className="text-xs text-gray-500">You have an appointment tomorrow at 10:00 AM</p>
                        <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                      </div>
                      <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-900">New Message</p>
                        <p className="text-xs text-gray-500">Dr. Smith sent you a message</p>
                        <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                      <a href="#" className="text-xs text-blue-600 hover:text-blue-500">View all notifications</a>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <button
                  type="button"
                  className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-600 text-white">
                    {getInitials(currentUser?.fullName)}
                  </div>
                </button>
                
                {/* Profile dropdown panel */}
                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 