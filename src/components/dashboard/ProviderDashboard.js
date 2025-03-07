import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Activity,
  Users,
  User,
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronRight,
  Shield,
  Sun,
  Moon,
  LogOut,
  Settings,
  HelpCircle
} from 'lucide-react';

// Simple loading component
const LoadingPlaceholder = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
  </div>
);

const StaffDashboard = () => {
  // Sidebar and UI states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  
  // User role state (Receptionist, Billing Specialist, Clinical Staff, Admin Staff)
  const [userRole, setUserRole] = useState('Receptionist');
  
  // Demo selector for role-based access control
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  
  // Live data states
  const [appointments, setAppointments] = useState({
    total: 0,
    waiting: 0,
    checkedIn: 0,
    scheduled: 0,
    items: [],
    loading: true
  });
  
  const [notifications, setNotifications] = useState({
    total: 0,
    unread: 0,
    items: [],
    loading: true
  });
  
  const [billingData, setBillingData] = useState({
    pendingItems: 0,
    outstanding: 0,
    todayPayments: 0,
    recentPayments: [],
    loading: true
  });
  
  // Mock data fetch
  useEffect(() => {
    // Initial fetch of all data
    fetchAppointments();
    fetchNotifications();
    fetchBillingData();
    
    // Set up polling for live updates (every 30 seconds)
    const appointmentPoll = setInterval(fetchAppointments, 30000);
    const notificationPoll = setInterval(fetchNotifications, 30000);
    
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
    
    // Clean up intervals on unmount
    return () => {
      clearInterval(appointmentPoll);
      clearInterval(notificationPoll);
    };
  }, []);
  
  // Simulated data fetching functions with WebSocket-like behavior
  const fetchAppointments = () => {
    // Simulate API call delay
    setTimeout(() => {
      const mockAppointments = {
        total: 34,
        waiting: Math.floor(Math.random() * 4) + 6, // Random between 6-9 to simulate live updates
        checkedIn: 12,
        scheduled: 14,
        items: [
          {
            id: 1,
            patientName: 'Sarah Johnson',
            patientId: 'P10045',
            age: 42,
            gender: 'Female',
            appointment: {
              doctorName: 'Dr. Michael Chen',
              time: '10:30 AM',
              type: 'General Checkup'
            },
            status: 'waiting',
            waitTime: '10 min'
          },
          {
            id: 2,
            patientName: 'Robert Smith',
            patientId: 'P10046',
            age: 65,
            gender: 'Male',
            appointment: {
              doctorName: 'Dr. Michael Chen',
              time: '11:15 AM',
              type: 'Follow-up'
            },
            status: 'scheduled'
          },
          {
            id: 3,
            patientName: 'Emily Davis',
            patientId: 'P10047',
            age: 28,
            gender: 'Female',
            appointment: {
              doctorName: 'Dr. Lisa Wong',
              time: '10:45 AM',
              type: 'Consultation'
            },
            status: 'checked-in'
          }
        ],
        loading: false
      };
      
      setAppointments(mockAppointments);
    }, 1000);
  };
  
  const fetchNotifications = () => {
    setTimeout(() => {
      // Sometimes add a new notification to simulate real-time updates
      const shouldAddNew = Math.random() > 0.7;
      let newNotifications = [...(notifications.items || [])];
      
      if (shouldAddNew && newNotifications.length < 8) {
        const newTypes = ['appointment', 'billing', 'system', 'message'];
        const newType = newTypes[Math.floor(Math.random() * newTypes.length)];
        const newTitle = 
          newType === 'appointment' ? 'New Appointment Request' :
          newType === 'billing' ? 'Payment Processed' :
          newType === 'system' ? 'System Update Required' :
          'New Message Received';
        
        newNotifications.unshift({
          id: Date.now(),
          type: newType,
          title: newTitle,
          message: `This is a notification about ${newType} that was just generated.`,
          time: new Date(),
          read: false
        });
      }
      
      setNotifications({
        total: newNotifications.length,
        unread: newNotifications.filter(n => !n.read).length,
        items: newNotifications,
        loading: false
      });
    }, 1500);
  };
  
  const fetchBillingData = () => {
    setTimeout(() => {
      setBillingData({
        pendingItems: 17,
        outstanding: 3240.75,
        todayPayments: 840.50,
        recentPayments: [
          {
            id: 1,
            patientName: 'James Wilson',
            amount: 125.00,
            type: 'Co-pay',
            date: new Date(Date.now() - 30 * 60000),
            method: 'Credit Card ending in 4242'
          },
          {
            id: 2,
            patientName: 'Emily Davis',
            amount: 75.00,
            type: 'Co-pay',
            date: new Date(Date.now() - 2 * 60 * 60000),
            method: 'Cash payment'
          }
        ],
        loading: false
      });
    }, 2000);
  };
  
  // Format timestamp for notifications
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
  
  // Role-based menu items
  const getMenuItems = (role) => {
    // Common items for all roles
    const commonItems = [
      { name: "Dashboard", icon: <Activity size={20} />, link: "#", access: ["all"] },
      { name: "Appointments", icon: <Calendar size={20} />, link: "#", access: ["all"] }
    ];
    
    // Role-specific items
    const roleSpecificItems = [
      { name: "Patient Records", icon: <FileText size={20} />, link: "#", access: ["Clinical Staff", "Admin Staff"] },
      { name: "Billing", icon: <CreditCard size={20} />, link: "#", access: ["Billing Specialist", "Admin Staff"] },
      { name: "Messages", icon: <MessageSquare size={20} />, link: "#", access: ["all"] },
      { name: "Staff Schedule", icon: <Users size={20} />, link: "#", access: ["Admin Staff"] },
      { name: "Insurance Claims", icon: <Shield size={20} />, link: "#", access: ["Billing Specialist", "Admin Staff"] }
    ];
    
    // Filter menu items based on role
    return [
      ...commonItems,
      ...roleSpecificItems.filter(item => 
        item.access.includes("all") || item.access.includes(role)
      )
    ];
  };
  
  // Get filtered menu items based on current role
  const menuItems = getMenuItems(userRole);
  
  return (
    <div className={`${darkMode ? 'dark' : ''} h-screen bg-gray-50 dark:bg-gray-900`}>
      {/* Role Selector (Demo only) */}
      {showRoleSelector && (
        <div className="fixed top-0 inset-x-0 bg-gray-800 text-white z-50 p-2 flex items-center justify-center space-x-4">
          <span className="text-sm font-medium">Staff Role Demo:</span>
          <select 
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600"
          >
            <option value="Receptionist">Receptionist</option>
            <option value="Billing Specialist">Billing Specialist</option>
            <option value="Clinical Staff">Clinical Staff</option>
            <option value="Admin Staff">Admin Staff</option>
          </select>
          <button 
            onClick={() => setShowRoleSelector(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="flex h-full" style={{ paddingTop: showRoleSelector ? '2.5rem' : 0 }}>
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-md transition-all duration-300 flex flex-col h-full z-20`}>
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
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              {sidebarOpen ? 
                <X size={20} className="text-gray-600 dark:text-gray-300" /> : 
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              }
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-3">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <div className="relative group">
                    <a 
                      href={item.link} 
                      className={`flex items-center p-3 rounded-lg ${
                        index === 0 ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {item.icon}
                      {sidebarOpen && <span className="ml-4">{item.name}</span>}
                    </a>
                    {!sidebarOpen && (
                      <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        {item.name}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              
              {/* Demo button to show role selector */}
              {!showRoleSelector && (
                <li className="mt-8">
                  <button 
                    onClick={() => setShowRoleSelector(true)}
                    className="w-full flex items-center p-3 rounded-lg text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  >
                    <User size={18} />
                    {sidebarOpen && <span className="ml-4">Demo: Change Role</span>}
                  </button>
                </li>
              )}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {sidebarOpen ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <span className="font-bold">JW</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">Jessica Williams</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userRole}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white cursor-pointer" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                  <span className="font-bold">JW</span>
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

              {/* Right side icons */}
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
                  {notifications.unread > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                      {notifications.unread}
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
                    <span className="hidden md:inline-block">Jessica Williams</span>
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
                <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                <p className="mt-2 text-blue-100">Manage appointments, patient records, and billing.</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Today's Schedule */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Today's Schedule</h3>
                  <Calendar className="text-blue-500 h-5 w-5" />
                </div>
                
                {appointments.loading ? (
                  <LoadingPlaceholder />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{appointments.total}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Appointments today</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">{appointments.waiting} patients waiting for check-in</p>
                  </>
                )}
                
                <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                  View All Appointments
                </button>
              </div>

              {/* Billing Items - Only show for Billing Specialist and Admin Staff */}
              {(userRole === 'Billing Specialist' || userRole === 'Admin Staff') && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Billing Items</h3>
                    <CreditCard className="text-green-500 h-5 w-5" />
                  </div>
                  
                  {billingData.loading ? (
                    <LoadingPlaceholder />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{billingData.pendingItems}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending items</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">{formatCurrency(billingData.outstanding)} outstanding</p>
                    </>
                  )}
                  
                  <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                    Process Payments
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Messages</h3>
                  <MessageSquare className="text-purple-500 h-5 w-5" />
                </div>
                
                {notifications.loading ? (
                  <LoadingPlaceholder />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{notifications.unread}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unread messages</p>
                    {notifications.items && notifications.items.filter(n => n.type === 'message' && !n.read).length > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        {notifications.items.filter(n => n.type === 'message' && !n.read).length} urgent message(s)
                      </p>
                    )}
                  </>
                )}
                
                <button 
                  onClick={() => setNotificationPanelOpen(true)}
                  className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
                >
                  View Messages
                </button>
              </div>

              {/* Insurance Claims - Only show for Billing Specialist and Admin Staff */}
              {(userRole === 'Billing Specialist' || userRole === 'Admin Staff') && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Insurance Claims</h3>
                    <Shield className="text-yellow-500 h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">8</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending claims</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">2 claims rejected</p>
                  <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                    Process Claims
                  </button>
                </div>
              )}
              
              {/* Patient Vitals - Only show for Clinical Staff */}
              {userRole === 'Clinical Staff' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Patient Vitals</h3>
                    <Activity className="text-red-500 h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending vital checks</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Next: Sarah Johnson</p>
                  <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                    Record Vitals
                  </button>
                </div>
              )}
              
              {/* Check-in Status - For Receptionist */}
              {userRole === 'Receptionist' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Check-in Status</h3>
                    <Users className="text-indigo-500 h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{appointments.waiting}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Patients waiting</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">{appointments.checkedIn} patients checked in</p>
                  <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                    Patient Check-in
                  </button>
                </div>
              )}
            </div>

            {/* Check-in Queue / Appointments Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {userRole === 'Receptionist' ? 'Check-in Queue' : 'Today\'s Appointments'}
                </h3>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-4">
                    {appointments.loading ? 'Loading...' : `${appointments.total} appointments today`}
                  </span>
                  <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    View All
                  </button>
                </div>
              </div>
              {appointments.loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Appointment</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {appointments.items.map((patient) => (
                        <tr key={patient.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="font-medium text-blue-800 dark:text-blue-200">
                                  {patient.patientName.split(' ').map(n => n.charAt(0)).join('')}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{patient.patientName}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{patient.age} years • {patient.gender}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{patient.appointment.doctorName} - {patient.appointment.time}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{patient.appointment.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              patient.status === 'waiting' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                : patient.status === 'checked-in'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {patient.status === 'waiting' 
                                ? `Waiting (${patient.waitTime})` 
                                : patient.status === 'checked-in' 
                                ? 'Checked In' 
                                : 'Scheduled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {patient.status === 'waiting' && (
                              <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Check In</button>
                            )}
                            <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Role-specific content sections */}
            {/* Billing Specialist & Admin Staff: Recent Payments */}
            {(userRole === 'Billing Specialist' || userRole === 'Admin Staff') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Recent Payments</h3>
                  {billingData.loading ? (
                    <LoadingPlaceholder />
                  ) : (
                    <div className="space-y-3">
                      {billingData.recentPayments.map(payment => (
                        <div key={payment.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{payment.patientName}</span>
                            <span className="text-sm text-green-600 dark:text-green-400">{formatCurrency(payment.amount)}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{payment.type} for visit on {new Date(payment.date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{payment.method}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="mt-4 w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                    View All Payments
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Process Payment
                    </button>
                    <button className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Submit Insurance Claim
                    </button>
                    <button className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Generate Invoice
                    </button>
                    <button className="p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Patient Billing History
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Receptionist: Quick Actions */}
            {userRole === 'Receptionist' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Check-in Patient
                  </button>
                  <button className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Schedule Appointment
                  </button>
                  <button className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                    New Patient Registration
                  </button>
                  <button className="p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Verify Insurance
                  </button>
                </div>
              </div>
            )}

            {/* Clinical Staff: Patient Metrics */}
            {userRole === 'Clinical Staff' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Patients Waiting for Vitals</h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mr-4">
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">SJ</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">Sarah Johnson</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Waiting for 10 minutes</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                        Record Vitals
                      </button>
                    </div>
                    <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mr-4">
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">JW</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">James Wilson</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Waiting for 5 minutes</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                        Record Vitals
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Record Vitals
                    </button>
                    <button className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Update Patient Records
                    </button>
                    <button className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                      View Lab Results
                    </button>
                    <button className="p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Patient Medical History
                    </button>
                  </div>
                </div>
              </div>
            )}
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
          
          {notifications.loading ? (
            <div className="p-4 space-y-4">
              <LoadingPlaceholder />
              <LoadingPlaceholder />
            </div>
          ) : (
            <div className="p-4">
              {notifications.items && notifications.items.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Recent Notifications</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {notifications.unread} unread
                    </span>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
                    {notifications.items.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg ${notification.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'}`}
                      >
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 mr-3 p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">{notification.title}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatNotificationTime(notification.time)}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                            {!notification.read && (
                              <button 
                                className="mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                onClick={() => {
                                  // Mark as read logic
                                  setNotifications(prev => ({
                                    ...prev,
                                    items: prev.items.map(item => 
                                      item.id === notification.id ? {...item, read: true} : item
                                    ),
                                    unread: prev.unread - 1
                                  }));
                                }}
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      onClick={() => {
                        // Mark all as read logic
                        setNotifications(prev => ({
                          ...prev,
                          items: prev.items.map(item => ({...item, read: true})),
                          unread: 0
                        }));
                      }}
                    >
                      Mark All as Read
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">No notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
                </div>
              )}
            </div>
          )}
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
    </div>
  );
};

export default StaffDashboard;