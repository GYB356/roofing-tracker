import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
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
  FiX,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiLock
} from 'react-icons/fi';
import ThemeSwitcher from '../common/ThemeSwitcher.js';

const Sidebar = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  // Remove the useState line and just use a constant
  const notifications = { hipaa: 0 }; // Default value for notifications
  
  const hasAccess = (roles) => {
    // For debugging - log the current user and roles
    console.log('Current user:', currentUser);
    console.log('Required roles:', roles);
    
    if (!currentUser || !roles) return false;
    
    // Super admin has access to everything
    if (currentUser.role === 'admin') return true;
    
    // Check if user has required role
    if (roles.includes(currentUser.role)) {
      // Additional HIPAA compliance check for sensitive routes
      const requiresHipaaConsent = ['doctor', 'nurse'].includes(currentUser.role);
      if (requiresHipaaConsent && (!currentUser.hipaaConsent || currentUser.hipaaConsent.status !== 'accepted')) {
        console.log('HIPAA consent required but not provided');
        return false;
      }
      return true;
    }
    
    console.log('User role not in required roles');
    return false;
  };
  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  const handleKeyDown = (e, menu) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu(menu);
    } else if (e.key === 'Escape') {
      setExpandedMenus(prev => ({ ...prev, [menu]: false }));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);
      const nextIndex = e.key === 'ArrowDown' 
        ? (currentIndex + 1) % menuItems.length
        : (currentIndex - 1 + menuItems.length) % menuItems.length;
      menuItems[nextIndex].focus();
    }
  };
  const handleSubmenuKeyDown = (e, path) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeMobileMenu();
    } else if (e.key === 'Escape') {
      e.currentTarget.closest('[role="menuitem"]').focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextSubmenuItem = e.currentTarget.nextElementSibling;
      if (nextSubmenuItem) nextSubmenuItem.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevSubmenuItem = e.currentTarget.previousElementSibling;
      if (prevSubmenuItem) prevSubmenuItem.focus();
    }
  };
  const menuItems = [
    {
      name: 'Dashboard',
      icon: <FiHome className="w-5 h-5" />,
      path: '/',
      roles: ['admin', 'doctor', 'nurse', 'patient', 'staff']
    },
    {
      name: 'Appointments',
      icon: <FiCalendar className="w-5 h-5" />,
      path: '/appointments',
      hasSubmenu: true,
      submenuKey: 'appointments',
      roles: ['admin', 'doctor', 'nurse', 'patient', 'staff'],
      submenu: [
        { name: 'View All', path: '/appointments' },
        { name: 'Schedule New', path: '/appointments/new' },
        { name: 'Calendar', path: '/appointments/calendar' }
      ]
    },
    {
      name: 'Medical Records',
      icon: <FiFileText className="w-5 h-5" />,
      path: '/medical-records',
      hasSubmenu: true,
      submenuKey: 'medicalRecords',
      roles: ['admin', 'doctor', 'nurse'],
      submenu: [
        { name: 'Patient Records', path: '/medical-records' },
        { name: 'Lab Results', path: '/medical-records/lab-results' },
        { name: 'Imaging', path: '/medical-records/imaging' }
      ]
    },
    {
      name: 'Messages',
      icon: <FiMessageSquare className="w-5 h-5" />,
      path: '/messages',
      roles: ['admin', 'doctor', 'nurse', 'patient', 'staff']
    },
    {
      name: 'Telemedicine',
      icon: <FiVideo className="w-5 h-5" />,
      path: '/telemedicine',
      roles: ['admin', 'doctor', 'patient']
    },
    {
      name: 'Billing',
      icon: <FiCreditCard className="w-5 h-5" />,
      path: '/billing',
      hasSubmenu: true,
      submenuKey: 'billing',
      roles: ['admin', 'staff', 'patient'],
      submenu: [
        { name: 'Invoices', path: '/billing/invoices' },
        { name: 'Payments', path: '/billing/payments' },
        { name: 'Insurance', path: '/billing/insurance' }
      ]
    },
    {
      name: 'HIPAA Compliance',
      icon: <FiLock className="w-5 h-5" />,
      path: '/hipaa',
      hasSubmenu: true,
      submenuKey: 'hipaa',
      roles: ['admin', 'doctor', 'nurse', 'staff'],
      submenu: [
        { name: 'HIPAA Documents', path: '/hipaa/documents' },
        { name: 'BAA Management', path: '/hipaa/baa-management' },
        { name: 'Compliance Training', path: '/hipaa/training' }
      ]
    },
    {
      name: 'Staff Management',
      icon: <FiUsers className="w-5 h-5" />,
      path: '/staff',
      roles: ['admin']
    },
    {
      name: 'Analytics',
      icon: <FiBarChart2 className="w-5 h-5" />,
      path: '/analytics',
      roles: ['admin']
    },
    {
      name: 'Health Metrics',
      icon: <FiActivity className="w-5 h-5" />,
      path: '/health-metrics',
      roles: ['admin', 'doctor', 'nurse', 'patient']
    },
    {
      name: 'Settings',
      icon: <FiSettings className="w-5 h-5" />,
      path: '/settings',
      roles: ['admin', 'doctor', 'nurse', 'patient', 'staff']
    }
  ];
  return (
    <>
      <button
        aria-label="Toggle mobile menu"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={handleMobileMenuToggle}
      >
        {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`h-screen flex flex-col w-64 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
          lg:relative lg:translate-x-0 lg:flex lg:flex-col
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <Link 
            to="/" 
            className="flex items-center" 
            onClick={closeMobileMenu}
            aria-label="Go to homepage"
          >
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
            aria-label="Toggle sidebar collapse"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-800 lg:block hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronDown />}
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1" role="menu">
            {menuItems.filter(item => hasAccess(item.roles)).map((item, index) => (
              <li key={index} role="none">
                {item.hasSubmenu ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.submenuKey)}
                      onKeyDown={(e) => handleKeyDown(e, item.submenuKey)}
                      className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors
                        ${isActive(item.path) ? 'bg-blue-700' : 'hover:bg-gray-800'}
                        ${isCollapsed ? 'justify-center' : 'justify-between'}
                      `}
                      aria-expanded={expandedMenus[item.submenuKey]}
                      aria-controls={`submenu-${item.submenuKey}`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        {item.icon}
                        {!isCollapsed && (
                          <div className="flex items-center">
                            <span className="ml-3">{item.name}</span>
                            {item.submenuKey === 'hipaa' && notifications.hipaa > 0 && (
                              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                {notifications.hipaa}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span aria-hidden="true">
                          {expandedMenus[item.submenuKey] ? (
                            <FiChevronDown className="w-4 h-4" />
                          ) : (
                            <FiChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </button>
                    {expandedMenus[item.submenuKey] && !isCollapsed && (
                      <ul 
                        id={`submenu-${item.submenuKey}`}
                        className="mt-1 pl-4 space-y-1"
                        role="menu"
                        aria-label={`${item.name} submenu`}
                      >
                        {item.submenu.map((subItem, subIndex) => (
                          <li key={subIndex} role="none">
                            <Link
                              to={subItem.path}
                              onClick={closeMobileMenu}
                              onKeyDown={(e) => handleSubmenuKeyDown(e, subItem.path)}
                              className={`flex items-center pl-8 pr-4 py-2 rounded-lg transition-colors
                                ${isActive(subItem.path) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                              `}
                              role="menuitem"
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
                    onClick={closeMobileMenu}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors
                      ${isActive(item.path) ? 'bg-blue-700' : 'hover:bg-gray-800'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    role="menuitem"
                  >
                    {item.icon}
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto">
          <div className="px-4 py-2 flex items-center justify-between">
            <ThemeSwitcher />
            <button 
              onClick={() => {
                logout();
                closeMobileMenu();
              }}
              className="text-red-500 hover:text-red-700 flex items-center"
            >
              <FiLogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;