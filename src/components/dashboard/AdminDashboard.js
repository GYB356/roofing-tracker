import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Users, 
  Settings, 
  Shield,
  CreditCard,
  Activity,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  ChevronRight,
  FileText,
  LogOut,
  HelpCircle,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  // State for toggling UI elements
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  
  // State for "live" data
  const [staffData, setStaffData] = useState({
    total: 0,
    onDuty: 0,
    physicians: 0,
    nurses: 0,
    staff: 0,
    loading: true
  });
  
  const [revenueData, setRevenueData] = useState({
    mtd: 0,
    outstanding: 0,
    yesterday: 0,
    loading: true
  });
  
  const [systemAlerts, setSystemAlerts] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    items: [],
    loading: true
  });
  
  // Fetch mock data (simulating API calls)
  useEffect(() => {
    // Simulate staff data API call
    const fetchStaffData = () => {
      setTimeout(() => {
        setStaffData({
          total: 42,
          onDuty: 24,
          physicians: 5,
          nurses: 12,
          staff: 7,
          loading: false
        });
      }, 1000);
    };
    
    // Simulate revenue data API call
    const fetchRevenueData = () => {
      setTimeout(() => {
        setRevenueData({
          mtd: 124850.75,
          outstanding: 38220.45,
          yesterday: 9876.50,
          loading: false
        });
      }, 1500);
    };
    
    // Simulate system alerts API call
    const fetchSystemAlerts = () => {
      setTimeout(() => {
        setSystemAlerts({
          total: 6,
          critical: 1,
          warning: 2,
          info: 3,
          items: [
            { 
              id: 1, 
              type: 'critical', 
              title: 'Server Disk Space Low', 
              message: 'File server at 92% capacity. Requires immediate attention.', 
              time: new Date(Date.now() - 30 * 60000) 
            },
            { 
              id: 2, 
              type: 'warning', 
              title: 'Failed Login Attempts', 
              message: '5 failed login attempts from IP 192.168.1.45', 
              time: new Date(Date.now() - 2 * 60 * 60000) 
            },
            { 
              id: 3, 
              type: 'warning', 
              title: 'Backup Delayed', 
              message: 'Nightly backup took longer than expected', 
              time: new Date(Date.now() - 5 * 60 * 60000) 
            },
            { 
              id: 4, 
              type: 'info', 
              title: 'System Update Available', 
              message: 'Version 2.4.5 is ready to install', 
              time: new Date(Date.now() - 8 * 60 * 60000) 
            },
            { 
              id: 5, 
              type: 'info', 
              title: 'User Account Created', 
              message: 'New staff member account was created', 
              time: new Date(Date.now() - 24 * 60 * 60000) 
            },
            { 
              id: 6, 
              type: 'info', 
              title: 'Scheduled Maintenance', 
              message: 'System maintenance scheduled for Sunday at 2:00 AM', 
              time: new Date(Date.now() - 48 * 60 * 60000) 
            }
          ],
          loading: false
        });
      }, 2000);
    };
    
    // Call all data fetching functions
    fetchStaffData();
    fetchRevenueData();
    fetchSystemAlerts();
    
    // Toggle dark mode based on system preference initially
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
    
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format time for notifications
  const formatNotificationTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / (60000 * 60));
    const diffDays = Math.floor(diffMs / (60000 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
  };
  
  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
      {/* Collapsible Sidebar with Tooltips */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ease-in-out flex flex-col h-full z-20`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">
                HS
              </div>
              <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">HealthcareSync</h1>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 mx-auto bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">
              HS
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <X size={20} className="text-gray-600 dark:text-gray-300" /> : <Menu size={20} className="text-gray-600 dark:text-gray-300" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-3">
            <li>
              <div className="relative group">
                <a 
                  href="#" 
                  className="flex items-center p-3 rounded-lg bg-blue-600 text-white"
                >
                  <Activity size={20} />
                  {sidebarOpen && <span className="ml-4">Dashboard</span>}
                </a>
                {!sidebarOpen && (
                  <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Dashboard
                  </div>
                )}
              </div>
            </li>
            <li>
              <div className="relative group">
                <a 
                  href="#" 
                  className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <BarChart2 size={20} />
                  {sidebarOpen && <span className="ml-4">Analytics</span>}
                </a>
                {!sidebarOpen && (
                  <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Analytics
                  </div>
                )}
              </div>
            </li>
            <li>
              <div className="relative group">
                <a 
                  href="#" 
                  className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Users size={20} />
                  {sidebarOpen && <span className="ml-4">Staff Management</span>}
                </a>
                {!sidebarOpen && (
                  <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Staff Management
                  </div>
                )}
              </div>
            </li>
            <li>
              <div className="relative group">
                <a 
                  href="#" 
                  className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <CreditCard size={20} />
                  {sidebarOpen && <span className="ml-4">Billing Overview</span>}
                </a>
                {!sidebarOpen && (
                  <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Billing Overview
                  </div>
                )}
              </div>
            </li>
            <li>
              <div className="relative group">
                <a 
                  href="#" 
                  className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings size={20} />
                  {sidebarOpen && <span className="ml-4">System Settings</span>}
                </a>
                {!sidebarOpen && (
                  <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    System Settings
                  </div>
                )}
              </div>
            </li>
            <li>
              <div className="relative group">
                <a 
                  href="#" 
                  className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Shield size={20} />
                  {sidebarOpen && <span className="ml-4">HIPAA Compliance</span>}
                </a>
                {!sidebarOpen && (
                  <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    HIPAA Compliance
                  </div>
                )}
              </div>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {sidebarOpen ? (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <span className="font-bold">RG</span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900 dark:text-white">Robert Garcia</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Administrator</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white cursor-pointer" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                <span className="font-bold">RG</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            {/* Breadcrumb */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">Home</a>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRight size={16} className="text-gray-400" />
                    <a href="#" className="ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white md:ml-2">Dashboard</a>
                  </div>
                </li>
              </ol>
            </nav>

            {/* Right side icons and controls */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode} 
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {/* Notification Bell */}
              <button 
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)} 
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative text-gray-600 dark:text-gray-300"
              >
                <Bell size={20} />
                {systemAlerts.critical > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                    {systemAlerts.critical}
                  </span>
                )}
              </button>
              
              {/* User Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <User size={20} />
                  <span className="hidden md:inline-block">Robert Garcia</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    <div className="py-1">
                      <a 
                        href="#" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center">
                          <User size={16} className="mr-2" />
                          <span>Your Profile</span>
                        </div>
                      </a>
                      <a 
                        href="#" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center">
                          <Settings size={16} className="mr-2" />
                          <span>Account Settings</span>
                        </div>
                      </a>
                      <a 
                        href="#" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center">
                          <HelpCircle size={16} className="mr-2" />
                          <span>Help &amp; Support</span>
                        </div>
                      </a>
                      <div className="border-t border-gray-200 dark:border-gray-700"></div>
                      <a 
                        href="#" 
                        className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center">
                          <LogOut size={16} className="mr-2" />
                          <span>Sign out</span>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-8 text-white">
              <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
              <p className="mt-2 text-blue-100">Facility and system management overview.</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Staff Overview */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Staff On Duty</h3>
                <Users className="text-blue-500 h-5 w-5" />
              </div>
              
              {staffData.loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{staffData.onDuty}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {staffData.physicians} Physicians, {staffData.nurses} Nurses, {staffData.staff} Staff
                  </p>
                </>
              )}
              
              <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                View Staff Schedule
              </button>
            </div>

            {/* Revenue Overview */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Revenue Overview</h3>
                <CreditCard className="text-green-500 h-5 w-5" />
              </div>
              
              {revenueData.loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(revenueData.mtd)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    MTD • {formatCurrency(revenueData.outstanding)} outstanding
                  </p>
                </>
              )}
              
              <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                View Financial Reports
              </button>
            </div>

            {/* System Alerts */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">System Alerts</h3>
                <Bell className="text-red-500 h-5 w-5" />
              </div>
              
              {systemAlerts.loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{systemAlerts.total}</p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {systemAlerts.critical} Critical, {systemAlerts.warning} Warning alerts
                  </p>
                </>
              )}
              
              <button 
                onClick={() => setNotificationPanelOpen(true)}
                className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
              >
                View All Alerts
              </button>
            </div>

            {/* Facility Status */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Facility Status</h3>
                <Activity className="text-yellow-500 h-5 w-5" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">78% Occupied</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">42/54 rooms currently in use</p>
              <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                View Facility Map
              </button>
            </div>
          </div>

          {/* Compliance and Activity Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">HIPAA Compliance Status</h3>
                <Shield className="text-green-500 h-5 w-5" />
              </div>
              <div className="flex items-center justify-center mb-4">
                <div className="relative h-24 w-24 flex items-center justify-center">
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700"></circle>
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="100" strokeDashoffset="5" strokeLinecap="round" transform="rotate(-90 18 18)"></circle>
                    <text x="18" y="18" textAnchor="middle" dominantBaseline="middle" fill="currentColor" fontSize="8" fontWeight="bold" className="text-gray-900 dark:text-white">95%</text>
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Audit:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Feb 15, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Next Audit:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">May 15, 2025</span>
                </div>
              </div>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Run Compliance Check
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">System Activity</h3>
                <Activity className="text-blue-500 h-5 w-5" />
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">System Backup</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">Completed</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today, 3:45 AM</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">Server Update</span>
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">Scheduled</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mar 10, 2:00 AM</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">Failed Login Attempts</span>
                    <span className="text-sm text-red-600 dark:text-red-400">5 attempts</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">IP: 192.168.1.45 • Today, 9:32 AM</p>
                </div>
              </div>
              <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                View System Logs
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Administrative Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <button className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex flex-col items-center justify-center text-center transition-colors">
              <BarChart2 className="h-6 w-6 mb-2" />
              <span className="font-medium">Revenue Report</span>
            </button>
            <button className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex flex-col items-center justify-center text-center transition-colors">
              <Users className="h-6 w-6 mb-2" />
              <span className="font-medium">Manage Staff</span>
            </button>
            <button className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex flex-col items-center justify-center text-center transition-colors">
              <Settings className="h-6 w-6 mb-2" />
              <span className="font-medium">System Settings</span>
            </button>
            <button className="p-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex flex-col items-center justify-center text-center transition-colors">
              <Shield className="h-6 w-6 mb-2" />
              <span className="font-medium">Security Audit</span>
            </button>
          </div>

          {/* Department Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Department Status</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                View Detailed Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Occupancy</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Emergency</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">8 / 10</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">85%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        High Volume
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Cardiology</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">6 / 6</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">70%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Normal
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Pediatrics</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">4 / 5</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">90%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Near Capacity
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      
      {/* Notification Panel */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-gray-800 shadow-lg transform ${notificationPanelOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-30`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h2>
          <button 
            onClick={() => setNotificationPanelOpen(false)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">System Alerts</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {systemAlerts.total} Total • {systemAlerts.critical} Critical
            </span>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {systemAlerts.items && systemAlerts.items.map(alert => (
              <div key={alert.id} className={`p-3 rounded-lg ${
                alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' :
                alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' :
                'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {alert.type === 'critical' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : alert.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{alert.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatNotificationTime(alert.time)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Mark All as Read
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay for when notification panel or other modals are open */}
      {(notificationPanelOpen || profileDropdownOpen) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 dark:bg-opacity-50 z-20"
          onClick={() => {
            setNotificationPanelOpen(false);
            setProfileDropdownOpen(false);
          }}
        ></div>
      )}
    </div>
  );
};

export default AdminDashboard;