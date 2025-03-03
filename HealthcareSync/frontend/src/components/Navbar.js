import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    const { user, logout, hasRole } = useAuth();
    const location = useLocation();
    
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    
    const toggleProfile = () => {
        setIsProfileOpen(!isProfileOpen);
        if (!isProfileOpen) {
            setIsNotificationsOpen(false);
        }
    };
    
    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        if (!isNotificationsOpen) {
            setIsProfileOpen(false);
        }
    };
    
    const handleLogout = () => {
        logout();
        // Redirect to login page would happen in the AuthContext
    };
    
    // Mock notifications for demonstration
    const notifications = [
        {
            id: 1,
            type: 'message',
            content: 'Dr. Smith sent you a message',
            time: '5 minutes ago',
            read: false
        },
        {
            id: 2,
            type: 'alert',
            content: 'Patient John Doe has updated their information',
            time: '1 hour ago',
            read: false
        },
        {
            id: 3,
            type: 'system',
            content: 'System maintenance scheduled for tonight at 2 AM',
            time: '3 hours ago',
            read: true
        }
    ];
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-blue-600 font-bold text-xl">
                                HealthcareSync
                            </Link>
                        </div>
                        
                        {/* Desktop Navigation */}
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link 
                                to="/dashboard" 
                                className={`${
                                    location.pathname === '/dashboard' 
                                        ? 'border-blue-500 text-gray-900' 
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                Dashboard
                            </Link>
                            
                            {hasRole(['doctor', 'nurse', 'admin']) && (
                                <Link 
                                    to="/telemedicine" 
                                    className={`${
                                        location.pathname === '/telemedicine' 
                                            ? 'border-blue-500 text-gray-900' 
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    Telemedicine
                                </Link>
                            )}
                            
                            {hasRole(['admin', 'staff']) && (
                                <Link 
                                    to="/staff-scheduling" 
                                    className={`${
                                        location.pathname === '/staff-scheduling' 
                                            ? 'border-blue-500 text-gray-900' 
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    Staff Scheduling
                                </Link>
                            )}
                            
                            <Link 
                                to="/patients" 
                                className={`${
                                    location.pathname.startsWith('/patients') 
                                        ? 'border-blue-500 text-gray-900' 
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                Patients
                            </Link>
                            
                            <Link 
                                to="/appointments" 
                                className={`${
                                    location.pathname.startsWith('/appointments') 
                                        ? 'border-blue-500 text-gray-900' 
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                Appointments
                            </Link>
                            
                            <Link 
                                to="/billing" 
                                className={`${
                                    location.pathname.startsWith('/billing') 
                                        ? 'border-blue-500 text-gray-900' 
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                            >
                                Billing
                            </Link>
                            
                            {user && (user.role === 'admin' || user.role === 'manager') && (
                                <Link 
                                    to="/analytics" 
                                    className={`${
                                        location.pathname.startsWith('/analytics') 
                                            ? 'border-blue-500 text-gray-900' 
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    Analytics
                                </Link>
                            )}
                        </div>
                    </div>
                    
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {/* Notifications dropdown */}
                        <div className="ml-3 relative">
                            <button
                                onClick={toggleNotifications}
                                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <span className="sr-only">View notifications</span>
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                                )}
                            </button>
                            
                            {isNotificationsOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1">
                                        <div className="px-4 py-2 border-b">
                                            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                                        </div>
                                        {notifications.length > 0 ? (
                                            <div className="max-h-60 overflow-y-auto">
                                                {notifications.map(notification => (
                                                    <div 
                                                        key={notification.id} 
                                                        className={`px-4 py-2 hover:bg-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <p className="text-sm text-gray-700">{notification.content}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-gray-700">
                                                No notifications
                                            </div>
                                        )}
                                        <div className="border-t px-4 py-2">
                                            <Link to="/notifications" className="text-xs text-blue-600 hover:text-blue-800">
                                                View all notifications
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Profile dropdown */}
                        <div className="ml-3 relative">
                            <div>
                                <button
                                    onClick={toggleProfile}
                                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    id="user-menu"
                                    aria-expanded="false"
                                    aria-haspopup="true"
                                >
                                    <span className="sr-only">Open user menu</span>
                                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                        {user ? user.name.charAt(0) : 'U'}
                                    </div>
                                </button>
                            </div>
                            
                            {isProfileOpen && (
                                <div
                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="user-menu"
                                >
                                    <div className="px-4 py-2 border-b">
                                        <p className="text-sm font-medium text-gray-900">{user ? user.name : 'User'}</p>
                                        <p className="text-xs text-gray-500">{user ? user.email : 'user@example.com'}</p>
                                    </div>
                                    
                                    <Link
                                        to="/profile"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                    >
                                        Your Profile
                                    </Link>
                                    
                                    <Link
                                        to="/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                    >
                                        Settings
                                    </Link>
                                    
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Icon when menu is closed */}
                            <svg
                                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            {/* Icon when menu is open */}
                            <svg
                                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile menu */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
                <div className="pt-2 pb-3 space-y-1">
                    <Link
                        to="/dashboard"
                        className={`${
                            location.pathname === '/dashboard'
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    >
                        Dashboard
                    </Link>
                    
                    {hasRole(['doctor', 'nurse', 'admin']) && (
                        <Link
                            to="/telemedicine"
                            className={`${
                                location.pathname === '/telemedicine'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                        >
                            Telemedicine
                        </Link>
                    )}
                    
                    {hasRole(['admin', 'staff']) && (
                        <Link
                            to="/staff-scheduling"
                            className={`${
                                location.pathname === '/staff-scheduling'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                        >
                            Staff Scheduling
                        </Link>
                    )}
                    
                    <Link
                        to="/patients"
                        className={`${
                            location.pathname.startsWith('/patients')
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    >
                        Patients
                    </Link>
                    
                    <Link
                        to="/appointments"
                        className={`${
                            location.pathname.startsWith('/appointments')
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    >
                        Appointments
                    </Link>
                    
                    <Link
                        to="/billing"
                        className={`${
                            location.pathname.startsWith('/billing')
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    >
                        Billing
                    </Link>
                    
                    {user && (user.role === 'admin' || user.role === 'manager') && (
                        <Link
                            to="/analytics"
                            className={`${
                                location.pathname.startsWith('/analytics')
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                        >
                            Analytics
                        </Link>
                    )}
                </div>
                
                <div className="pt-4 pb-3 border-t border-gray-200">
                    <div className="flex items-center px-4">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                {user ? user.name.charAt(0) : 'U'}
                            </div>
                        </div>
                        <div className="ml-3">
                            <div className="text-base font-medium text-gray-800">{user ? user.name : 'User'}</div>
                            <div className="text-sm font-medium text-gray-500">{user ? user.email : 'user@example.com'}</div>
                        </div>
                        <button
                            onClick={toggleNotifications}
                            className="ml-auto bg-white flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <span className="sr-only">View notifications</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                            )}
                        </button>
                    </div>
                    <div className="mt-3 space-y-1">
                        <Link
                            to="/profile"
                            className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        >
                            Your Profile
                        </Link>
                        
                        <Link
                            to="/settings"
                            className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        >
                            Settings
                        </Link>
                        
                        <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 