import React, { useState } from 'react';
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
  FiHelpCircle,
  FiChevronRight,
  FiChevronDown,
  FiMenu,
  FiX
} from 'react-icons/fi';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    appointments: false,
    medicalRecords: false,
    billing: false
  });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    {
      name: 'Dashboard',
      icon: <FiHome className="w-5 h-5" />,
      path: '/',
      exact: true
    },
    {
      name: 'Appointments',
      icon: <FiCalendar className="w-5 h-5" />,
      path: '/appointments',
      hasSubmenu: true,
      submenuKey: 'appointments',
      submenu: [
        { name: 'My Appointments', path: '/appointments' },
        { name: 'Schedule New', path: '/appointments/new' },
        { name: 'Calendar View', path: '/appointments/calendar' }
      ]
    },
    {
      name: 'Medical Records',
      icon: <FiFileText className="w-5 h-5" />,
      path: '/medical-records',
      hasSubmenu: true,
      submenuKey: 'medicalRecords',
      submenu: [
        { name: 'Health Summary', path: '/medical-records' },
        { name: 'Medications', path: '/medical-records/medications' },
        { name: 'Lab Results', path: '/medical-records/lab-results' },
        { name: 'Imaging', path: '/medical-records/imaging' }
      ]
    },
    {
      name: 'Messages',
      icon: <FiMessageSquare className="w-5 h-5" />,
      path: '/messages'
    },
    {
      name: 'Telemedicine',
      icon: <FiVideo className="w-5 h-5" />,
      path: '/telemedicine'
    },
    {
      name: 'Billing',
      icon: <FiCreditCard className="w-5 h-5" />,
      path: '/billing',
      hasSubmenu: true,
      submenuKey: 'billing',
      submenu: [
        { name: 'Invoices', path: '/billing/invoices' },
        { name: 'Payment Methods', path: '/billing/payment-methods' }
      ]
    },
    {
      name: 'Health Metrics',
      icon: <FiActivity className="w-5 h-5" />,
      path: '/health-metrics'
    },
    {
      name: 'Settings',
      icon: <FiSettings className="w-5 h-5" />,
      path: '/settings'
    }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white bg-blue-600 hover:bg-blue-700 rounded-lg p-2"
        >
          {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 transform bg-gray-900 text-white 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
          lg:relative lg:translate-x-0 lg:flex lg:flex-col
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="HealthcareSync Logo"
              className="h-8 w-8"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItYWN0aXZpdHkiPjxwb2x5bGluZSBwb2ludHM9IjIyIDEyIDE4IDEyIDE1IDE5IDkgNSA2IDEyIDIgMTIiPjwvcG9seWxpbmU+PC9zdmc+';
              }}
            />
            {!isCollapsed && (
              <span className="ml-2 text-xl font-semibold tracking-wider">HealthcareSync</span>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-800 lg:block hidden"
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronDown />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.hasSubmenu ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.submenuKey)}
                      className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors
                        ${isActive(item.path) ? 'bg-blue-700' : 'hover:bg-gray-800'}
                        ${isCollapsed ? 'justify-center' : 'justify-between'}
                      `}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        {!isCollapsed && <span className="ml-3">{item.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <span>
                          {expandedMenus[item.submenuKey] ? (
                            <FiChevronDown className="w-4 h-4" />
                          ) : (
                            <FiChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </button>
                    {expandedMenus[item.submenuKey] && !isCollapsed && (
                      <ul className="mt-1 pl-4 space-y-1">
                        {item.submenu.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              to={subItem.path}
                              className={`flex items-center pl-8 pr-4 py-2 rounded-lg transition-colors
                                ${isActive(subItem.path) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                              `}
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
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors
                      ${isActive(item.path) ? 'bg-blue-700' : 'hover:bg-gray-800'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom help section */}
        <div className="p-4 border-t border-gray-800">
          <Link
            to="/help"
            className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiHelpCircle className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Help & Support</span>}
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;