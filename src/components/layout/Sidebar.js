import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome,
  FiCalendar,
  FiFileText,
  FiMessageSquare,
  FiVideo,
  FiCreditCard,
  FiActivity,
  FiSettings,
  FiUsers,
  FiDatabase,
  FiAlertCircle,
  FiHelpCircle,
  FiChevronRight,
  FiChevronDown
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = React.useState({});

  // Toggle submenu expansion
  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Check if a path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    // Common navigation items for all users
    const commonItems = [
      {
        name: 'Dashboard',
        path: '/',
        icon: <FiHome size={20} />
      },
      {
        name: 'Appointments',
        path: '/appointments',
        icon: <FiCalendar size={20} />,
        submenu: [
          { name: 'My Appointments', path: '/appointments' },
          { name: 'Schedule New', path: '/appointments/new' },
          { name: 'Calendar View', path: '/appointments/calendar' }
        ]
      },
      {
        name: 'Medical Records',
        path: '/medical-records',
        icon: <FiFileText size={20} />,
        submenu: [
          { name: 'Health Summary', path: '/medical-records' },
          { name: 'Medications', path: '/medical-records/medications' },
          { name: 'Lab Results', path: '/medical-records/lab-results' },
          { name: 'Imaging', path: '/medical-records/imaging' }
        ]
      },
      {
        name: 'Messages',
        path: '/messages',
        icon: <FiMessageSquare size={20} />
      },
      {
        name: 'Telemedicine',
        path: '/telemedicine',
        icon: <FiVideo size={20} />
      },
      {
        name: 'Billing',
        path: '/billing',
        icon: <FiCreditCard size={20} />,
        submenu: [
          { name: 'Invoices', path: '/billing/invoices' },
          { name: 'Payment Methods', path: '/billing/payment-methods' },
          { name: 'Insurance', path: '/billing/insurance' }
        ]
      },
      {
        name: 'Health Metrics',
        path: '/health-metrics',
        icon: <FiActivity size={20} />
      },
      {
        name: 'Settings',
        path: '/settings',
        icon: <FiSettings size={20} />
      }
    ];

    // Admin-specific items
    const adminItems = [
      {
        name: 'User Management',
        path: '/admin/users',
        icon: <FiUsers size={20} />
      },
      {
        name: 'System Logs',
        path: '/admin/logs',
        icon: <FiDatabase size={20} />
      },
      {
        name: 'Alerts',
        path: '/admin/alerts',
        icon: <FiAlertCircle size={20} />
      }
    ];

    // Doctor-specific items
    const doctorItems = [
      {
        name: 'My Patients',
        path: '/doctor/patients',
        icon: <FiUsers size={20} />
      },
      {
        name: 'Prescriptions',
        path: '/doctor/prescriptions',
        icon: <FiFileText size={20} />
      }
    ];

    // Nurse-specific items
    const nurseItems = [
      {
        name: 'Patient Care',
        path: '/nurse/patients',
        icon: <FiUsers size={20} />
      },
      {
        name: 'Vitals Tracking',
        path: '/nurse/vitals',
        icon: <FiActivity size={20} />
      }
    ];

    // Return role-specific navigation
    if (user) {
      switch (user.role) {
        case 'admin':
          return [...commonItems, ...adminItems];
        case 'doctor':
          return [...commonItems, ...doctorItems];
        case 'nurse':
          return [...commonItems, ...nurseItems];
        default:
          return commonItems;
      }
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="px-4 py-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center">
            <img
              className="h-8 w-auto"
              src="/logo.png"
              alt="HealthcareSync Logo"
            />
            <span className="ml-2 text-xl font-bold text-primary-600 dark:text-primary-400">
              HealthcareSync
            </span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                {item.submenu ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                        isActive(item.path)
                          ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </div>
                      {expandedMenus[item.name] ? (
                        <FiChevronDown size={16} />
                      ) : (
                        <FiChevronRight size={16} />
                      )}
                    </button>
                    {expandedMenus[item.name] && (
                      <ul className="pl-10 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.path}>
                            <Link
                              to={subItem.path}
                              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                                isActive(subItem.path)
                                  ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive(item.path)
                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Help Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/help"
            className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <FiHelpCircle className="mr-3" size={20} />
            Help & Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;