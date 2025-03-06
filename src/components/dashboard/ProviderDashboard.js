import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiCalendar, 
  FiUsers, 
  FiFileText, 
  FiMessageSquare, 
  FiVideo, 
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

const ProviderDashboard = () => {
  const { currentUser } = useAuth();

  // Provider-specific quick actions
  const providerActions = [
    {
      title: 'Today\'s Appointments',
      description: 'View and manage your schedule for today',
      icon: <FiCalendar className="h-8 w-8 text-blue-500" />,
      link: '/appointments/calendar',
      color: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Patient Management',
      description: 'Search and manage your patient records',
      icon: <FiUsers className="h-8 w-8 text-green-500" />,
      link: '/patients',
      color: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'Medical Records',
      description: 'Access and update patient medical records',
      icon: <FiFileText className="h-8 w-8 text-purple-500" />,
      link: '/medical-records',
      color: 'bg-purple-50 dark:bg-purple-900/30',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Messages',
      description: 'Communicate with patients and colleagues',
      icon: <FiMessageSquare className="h-8 w-8 text-red-500" />,
      link: '/messages',
      color: 'bg-red-50 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      title: 'Telemedicine',
      description: 'Start or join virtual consultations',
      icon: <FiVideo className="h-8 w-8 text-yellow-500" />,
      link: '/telemedicine',
      color: 'bg-yellow-50 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'Patient Health Metrics',
      description: 'Monitor patient health statistics',
      icon: <FiActivity className="h-8 w-8 text-indigo-500" />,
      link: '/health-metrics',
      color: 'bg-indigo-50 dark:bg-indigo-900/30',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
  ];

  // Provider metrics for the dashboard
  const providerMetrics = [
    { label: 'Appointments Today', value: '12', change: '+2', isPositive: true },
    { label: 'Active Patients', value: '248', change: '+5%', isPositive: true },
    { label: 'Pending Messages', value: '8', change: '-3', isPositive: true },
    { label: 'Upcoming Telemedicine', value: '4', change: '+1', isPositive: true },
  ];

  // Upcoming appointments for quick view
  const upcomingAppointments = [
    {
      patientName: 'John Smith',
      time: '9:00 AM',
      type: 'Follow-up',
      status: 'Confirmed'
    },
    {
      patientName: 'Sarah Johnson',
      time: '10:30 AM',
      type: 'New Patient',
      status: 'Confirmed'
    },
    {
      patientName: 'Michael Brown',
      time: '1:15 PM',
      type: 'Telemedicine',
      status: 'Pending'
    },
    {
      patientName: 'Emily Davis',
      time: '3:45 PM',
      type: 'Follow-up',
      status: 'Confirmed'
    }
  ];

  return (
    <PageLayout
      title={`Provider Dashboard${currentUser?.firstName ? ' - Dr. ' + currentUser.firstName + ' ' + currentUser.lastName : ''}`}
      description="Manage your patients, appointments, and clinical workflow"
      bgColor="bg-gradient-to-r from-green-700 to-green-800"
      textColor="text-green-100"
    >
      {/* Provider Metrics Section */}
      <div className="mb-8 mt-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Today's Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {providerMetrics.map((metric, index) => (
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

      {/* Upcoming Appointments Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upcoming Appointments
          </h2>
          <Link 
            to="/appointments/calendar"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
          >
            View All
            <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {upcomingAppointments.map((appointment, index) => (
              <li key={index}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {appointment.patientName}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {appointment.time} - {appointment.type}
                      </p>
                    </div>
                    <div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Provider Actions Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providerActions.map((action, index) => (
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
                      Go to {action.title}
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

export default ProviderDashboard;