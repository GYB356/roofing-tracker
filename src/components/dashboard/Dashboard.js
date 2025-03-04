import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  FiCalendar, 
  FiMessageSquare, 
  FiFileText, 
  FiActivity, 
  FiCreditCard, 
  FiVideo,
  FiAlertCircle,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { connected } = useSocket();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    unreadMessages: 0,
    pendingPrescriptions: 0,
    newLabResults: 0,
    pendingBills: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState(null);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // In a real app, these would be separate API calls
        // For demo purposes, we're simulating the data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setStats({
          upcomingAppointments: 2,
          unreadMessages: 3,
          pendingPrescriptions: 1,
          newLabResults: 2,
          pendingBills: 1
        });
        
        setRecentActivity([
          {
            id: 1,
            type: 'appointment',
            title: 'Appointment Confirmed',
            description: 'Your appointment with Dr. Smith has been confirmed',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            id: 2,
            type: 'message',
            title: 'New Message',
            description: 'You received a new message from Dr. Johnson',
            date: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
          },
          {
            id: 3,
            type: 'lab',
            title: 'Lab Results Available',
            description: 'Your blood test results are now available',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            id: 4,
            type: 'prescription',
            title: 'Prescription Renewed',
            description: 'Your prescription for Lisinopril has been renewed',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ]);
        
        setHealthMetrics({
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          },
          heartRate: {
            value: 72,
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          weight: {
            value: 70.5, // kg
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          },
          bloodGlucose: {
            value: 95, // mg/dL
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  
  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  };
  
  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <FiCalendar className="text-blue-500" />;
      case 'message':
        return <FiMessageSquare className="text-green-500" />;
      case 'lab':
        return <FiFileText className="text-purple-500" />;
      case 'prescription':
        return <FiFileText className="text-orange-500" />;
      case 'billing':
        return <FiCreditCard className="text-red-500" />;
      case 'telemedicine':
        return <FiVideo className="text-teal-500" />;
      default:
        return <FiActivity className="text-gray-500" />;
    }
  };
  
  if (loading) {
    return <LoadingSpinner size="large" fullScreen />;
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Here's what's happening with your health today.
            </p>
          </div>
          <div className="flex items-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              connected 
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
            }`}>
              {connected ? (
                <>
                  <FiCheckCircle className="mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <FiAlertCircle className="mr-1" />
                  Offline
                </>
              )}
            </span>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Link to="/appointments" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              <FiCalendar size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Appointments</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.upcomingAppointments}</p>
            </div>
          </div>
        </Link>
        
        <Link to="/messages" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
              <FiMessageSquare size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unread Messages</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.unreadMessages}</p>
            </div>
          </div>
        </Link>
        
        <Link to="/medical-records/medications" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300">
              <FiFileText size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Prescriptions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingPrescriptions}</p>
            </div>
          </div>
        </Link>
        
        <Link to="/medical-records/lab-results" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
              <FiFileText size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New Lab Results</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.newLabResults}</p>
            </div>
          </div>
        </Link>
        
        <Link to="/billing" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
              <FiCreditCard size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Bills</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingBills}</p>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <FiClock className="mr-1" />
                            {formatRelativeTime(activity.date)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No recent activity to display.
              </p>
            )}
            
            <div className="mt-4 text-center">
              <Link
                to="/activity"
                className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                View all activity
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Health Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Health Metrics</h2>
          </div>
          <div className="p-6">
            {healthMetrics ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Blood Pressure</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(healthMetrics.bloodPressure.date)}
                    </p>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {healthMetrics.bloodPressure.systolic}/{healthMetrics.bloodPressure.diastolic} mmHg
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Heart Rate</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(healthMetrics.heartRate.date)}
                    </p>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {healthMetrics.heartRate.value} bpm
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(healthMetrics.weight.date)}
                    </p>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {healthMetrics.weight.value} kg
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Blood Glucose</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(healthMetrics.bloodGlucose.date)}
                    </p>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {healthMetrics.bloodGlucose.value} mg/dL
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No health metrics available.
              </p>
            )}
            
            <div className="mt-4 text-center">
              <Link
                to="/health-metrics"
                className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                View all metrics
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/appointments/new"
            className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            <FiCalendar size={24} className="text-blue-600 dark:text-blue-300 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white text-center">Schedule Appointment</span>
          </Link>
          
          <Link
            to="/messages/new"
            className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
          >
            <FiMessageSquare size={24} className="text-green-600 dark:text-green-300 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white text-center">Send Message</span>
          </Link>
          
          <Link
            to="/telemedicine"
            className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
          >
            <FiVideo size={24} className="text-purple-600 dark:text-purple-300 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white text-center">Start Telemedicine</span>
          </Link>
          
          <Link
            to="/health-metrics/add"
            className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors"
          >
            <FiActivity size={24} className="text-orange-600 dark:text-orange-300 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white text-center">Log Health Data</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 