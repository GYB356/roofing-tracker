import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiUsers, 
  FiClipboard, 
  FiSettings, 
  FiShield, 
  FiFileText, 
  FiActivity 
} from 'react-icons/fi';

// Reusing the PageLayout component from Dashboard.js
const PageLayout = ({ 
  title, 
  description, 
  bgColor = "bg-blue-600", 
  textColor = "text-blue-100", 
  children,
  actions
}) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-screen-xl">
      {/* Header section */}
      <div className={`${bgColor} rounded-t-lg shadow-lg overflow-hidden`}>
        <div className="px-6 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className={`mt-2 ${textColor}`}>{description}</p>
            </div>
            {actions && (
              <div className="ml-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content section */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { currentUser } = useAuth();

  // Admin-specific quick actions
  const adminActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <FiUsers className="h-8 w-8 text-blue-500" />,
      link: '/admin/users',
      color: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Appointment Management',
      description: 'Oversee all appointments and scheduling',
      icon: <FiClipboard className="h-8 w-8 text-green-500" />,
      link: '/admin/appointments',
      color: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: <FiSettings className="h-8 w-8 text-purple-500" />,
      link: '/admin/settings',
      color: 'bg-purple-50 dark:bg-purple-900/30',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'HIPAA Compliance',
      description: 'Manage BAAs and compliance documentation',
      icon: <FiShield className="h-8 w-8 text-red-500" />,
      link: '/admin/hipaa',
      color: 'bg-red-50 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      title: 'Reports',
      description: 'Generate and view system-wide reports',
      icon: <FiFileText className="h-8 w-8 text-yellow-500" />,
      link: '/admin/reports',
      color: 'bg-yellow-50 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and metrics',
      icon: <FiActivity className="h-8 w-8 text-indigo-500" />,
      link: '/admin/system-health',
      color: 'bg-indigo-50 dark:bg-indigo-900/30',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
  ];

  // Admin metrics for the dashboard
  const adminMetrics = [
    { label: 'Total Users', value: '1,245', change: '+12%', isPositive: true },
    { label: 'Active Providers', value: '48', change: '+3', isPositive: true },
    { label: 'Appointments Today', value: '87', change: '-5%', isPositive: false },
    { label: 'Pending BAAs', value: '7', change: '-2', isPositive: true },
  ];

  return (
    <PageLayout
      title={`Admin Dashboard${currentUser?.firstName ? ' - ' + currentUser.firstName : ''}`}
      description="System administration and management overview"
      bgColor="bg-gradient-to-r from-gray-700 to-gray-800"
      textColor="text-gray-300"
    >
      {/* Admin Metrics Section */}
      <div className="mb-8 mt-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          System Metrics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminMetrics.map((metric, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.label}</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-semibold text-gray-900 dark:text-white">{metric.value}</p>
                <p className={`ml-2 text-sm font-medium ${metric.isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {metric.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Actions Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Administrative Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((action, index) => (
            <Link 
              to={action.link}
              key={index}
              className={`${action.color} ${action.borderColor} border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 h-full`}
            >
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-white bg-opacity-50 dark:bg-opacity-10">
                    {action.icon}
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {action.description}
                    </p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                      Manage {action.title}
                      <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;