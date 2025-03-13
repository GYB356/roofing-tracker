import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Import icons from Lucide React
import {
  Home,
  Calendar,
  FileText,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  ChevronDown,
  Video,
  BarChart2,
  Activity,
  Clock,
  DollarSign,
  Clipboard,
  List,
  CheckSquare
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Determine user role for conditional menu items
  const userRole = currentUser?.role || 'PATIENT';
  
  // Define menu structure
  const menuItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <Home className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'PATIENT', 'STAFF']
    },
    {
      title: 'Appointments',
      path: '/appointments',
      icon: <Calendar className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'PATIENT', 'STAFF'],
      submenu: [
        { title: 'All Appointments', path: '/appointments' },
        { title: 'Schedule New', path: '/appointments/schedule' },
        { title: 'Calendar View', path: '/appointments/calendar' }
      ]
    },
    {
      title: 'Medical Records',
      path: '/medical-records',
      icon: <FileText className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'PATIENT'],
      submenu: [
        { title: 'Health Summary', path: '/medical-records/health-summary' },
        { title: 'Medications', path: '/medical-records/medications' },
        { title: 'Lab Results', path: '/medical-records/lab-results' },
        { title: 'Imaging', path: '/medical-records/imaging' }
      ]
    },
    {
      title: 'Messages',
      path: '/messages',
      icon: <MessageCircle className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'PATIENT', 'STAFF']
    },
    {
      title: 'Telemedicine',
      path: '/telemedicine',
      icon: <Video className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'PATIENT']
    },
    {
      title: 'Health Metrics',
      path: '/health-metrics',
      icon: <Activity className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'PATIENT']
    },
    {
      title: 'Clients',
      path: '/clients',
      icon: <Users className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'STAFF']
    },
    {
      title: 'Projects',
      path: '/projects',
      icon: <Clipboard className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'STAFF'],
    },
    {
      title: 'Tasks',
      path: '/tasks',
      icon: <CheckSquare className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'STAFF'],
    },
    {
      title: 'Time Tracking',
      path: '/time-tracking',
      icon: <Clock className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'STAFF'],
      submenu: [
        { title: 'Timer', path: '/time-tracking' },
        { title: 'Time Entries', path: '/time-tracking/entries' },
        { title: 'Reports', path: '/time-tracking/summary' },
        { title: 'Settings', path: '/time-tracking/settings' }
      ]
    },
    {
      title: 'Billing',
      path: '/billing',
      icon: <DollarSign className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'STAFF'],
      submenu: [
        { title: 'Dashboard', path: '/billing' },
        { title: 'Invoices', path: '/billing/invoices' },
        { title: 'Generate Invoice', path: '/billing/invoice-generator' },
        { title: 'Payment Methods', path: '/billing/payment-methods' }
      ]
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: <BarChart2 className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER']
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />, 
      roles: ['ADMIN', 'PROVIDER', 'PATIENT', 'STAFF']
    }
  ];
  
  // Toggle submenu expansion
  const toggleSubmenu = (index) => {
    setExpanded({ ...expanded, [index]: !expanded[index] });
  };
  
  // Auto-expand submenu based on current path
  useEffect(() => {
    const expandedState = {};
    
    menuItems.forEach((item, index) => {
      if (item.submenu && (
        location.pathname === item.path || 
        item.submenu.some(submenu => location.pathname === submenu.path)
      )) {
        expandedState[index] = true;
      }
    });
    
    setExpanded(expandedState);
  }, [location.pathname]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect is handled by AuthContext's onChange effect
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  // Mobile menu toggle
  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  // Filter menu items by user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );
  
  return (
    <>
      {/* Mobile menu button - only shown on small screens */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-20 bg-blue-600 text-white p-2 rounded-md"
        onClick={toggleMobile}
        aria-label="Toggle menu"
      >
        <List className="w-5 h-5" />
      </button>
      
      {/* Sidebar backdrop for mobile - only shown when menu is open on mobile */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobile}
        />
      )}
      
      {/* Sidebar content */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* App logo and name */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <Link to="/" className="text-xl font-bold text-blue-400">
            HealthcareSync
          </Link>
        </div>
        
        {/* User info */}
        {currentUser && (
          <div className="p-4 border-b border-gray-700">
            <div className="font-medium">{currentUser.firstName} {currentUser.lastName}</div>
            <div className="text-sm text-gray-400">{userRole}</div>
          </div>
        )}
        
        {/* Menu items */}
        <nav className="mt-2 overflow-y-auto h-[calc(100vh-12rem)]">
          <ul className="space-y-1 px-2">
            {filteredMenuItems.map((item, index) => (
              <li key={index}>
                {/* Main menu item */}
                {item.submenu ? (
                  // Menu item with submenu
                  <div className="mb-1">
                    <button
                      className={`flex items-center justify-between w-full p-2 rounded-md ${
                        location.pathname === item.path || 
                        (item.submenu && item.submenu.some(sub => location.pathname === sub.path))
                          ? 'bg-gray-700 text-white'
                          : 'hover:bg-gray-700 text-gray-300'
                      }`}
                      onClick={() => toggleSubmenu(index)}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expanded[index] ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Submenu */}
                    {expanded[index] && (
                      <ul className="pl-6 mt-1 space-y-1">
                        {item.submenu.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              to={subItem.path}
                              className={`block p-2 rounded-md ${
                                location.pathname === subItem.path
                                  ? 'bg-blue-600 text-white'
                                  : 'hover:bg-gray-700 text-gray-300'
                              }`}
                              onClick={() => isMobileOpen && toggleMobile()}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Regular menu item without submenu
                  <Link
                    to={item.path}
                    className={`flex items-center p-2 rounded-md ${
                      location.pathname === item.path
                        ? 'bg-gray-700 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => isMobileOpen && toggleMobile()}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout button at bottom */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2 rounded-md hover:bg-red-700 text-gray-300 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;