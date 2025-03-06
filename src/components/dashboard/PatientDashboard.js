import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiCalendar, 
  FiFileText, 
  FiMessageSquare, 
  FiVideo, 
  FiCreditCard, 
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

const PatientDashboard = () => {
  const { currentUser } = useAuth();

  // Patient-specific quick actions
  const patientActions = [
    {
      title: 'Appointments',
      description: 'View upcoming appointments or schedule a new one',
      icon: <FiCalendar className="h-8 w-8 text-blue-500" />,
      link: '/appointments',
      color: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Medical Records',
      description: 'Access your medical history and documents',
      icon: <FiFileText className="h-8 w-8 text-green-500" />,
      link: '/medical-records',
      color: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'Messages',
      description: 'Communicate with your healthcare providers',
      icon: <FiMessageSquare className="h-8 w-8 text-purple-500" />,
      link: '/messages',
      color: 'bg-purple-50 dark:bg-purple-900/30',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Telemedicine',
      description: 'Start or join a virtual consultation',
      icon: <FiVideo className="h-8 w-8 text-red-500" />,
      link: '/telemedicine',
      color: 'bg-red-50 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      title: 'Billing',
      description: 'View and manage payments and insurance claims',
      icon: <FiCreditCard className="h-8 w-8 text-yellow-500" />,
      link: '/billing',
      color: 'bg-yellow-50 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'Health Metrics',
      description: 'Track your health statistics and progress',
      icon: <FiActivity className="h-8 w-8 text-indigo-500" />,
      link: '/health-metrics',
      color: 'bg-indigo-50 dark:bg-indigo-900/30',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
  ];

  // Patient metrics for the dashboard
  const patientMetrics = [
    { label: 'Next Appointment', value: 'May 15', change: '3 days', isPositive: true },
    { label: 'Unread Messages', value: '2', change: '+1', isPositive: false },
    { label: 'Prescription Refills', value: '1', change: 'Due soon', isPositive: false },
    { label: 'Health Score', value: '85', change: '+5%', isPositive: true },
  ];

  // Upcoming appointments for quick view
  const upcomingAppointments = [
    {
      provider: 'Dr. Sarah Johnson',
      date: 'May 15, 2023',
      time: '10:30 AM',
      type: 'Annual Physical',
      location: 'Main Clinic'
    },
    {
      provider: 'Dr. Michael Chen',
      date: 'June 2, 2023',
      time: '2:15 PM',
      type: 'Follow-up',
      location: 'Telemedicine'
    }
  ];

  // Recent health metrics for quick view
  const recentMetrics = [
    {
      name: 'Blood Pressure',
      value: '120/80 mmHg',
      date: 'April 28, 2023',
      status: 'normal'
    },
    {
      name: 'Weight',
      value: '165 lbs',
      date: 'May 1, 2023',
      status: 'normal'
    },
    {
      name: 'Blood Glucose',
      value: '110 mg/dL',
      date: 'May 2, 2023',
      status: 'elevated'
    }
  ];

  return (
    <PageLayout
      title={`Welcome${currentUser?.firstName ? ', ' + currentUser.firstName : ''}!`}
      description="Here's an overview of your healthcare information and services."
      bgColor="bg-gradient-to-r from-blue-600 to-blue-700"
      textColor="text-blue-100"
    >
      {/* Patient Metrics Section */}
      <div className="mb-8 mt-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Your Health at a Glance
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {patientMetrics.map((metric, index) => (
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
            to="/appointments"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
          >
            Schedule New
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
          {upcomingAppointments.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {upcomingAppointments.map((appointment, index) => (
                <li key={index}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {appointment.provider}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {appointment.date} at {appointment.time} - {appointment.type}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Location: {appointment.location}
                        </p>
                      </div>
                      <div>
                        <Link 
                          to="/appointments"
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <p>No upcoming appointments scheduled.</p>
              <Link 
                to="/appointments/new"
                className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Schedule an appointment
                <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Health Metrics Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Health Metrics
          </h2>
          <Link 
            to="/health-metrics"
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
            {recentMetrics.map((metric, index) => (
              <li key={index}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {metric.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Recorded on: {metric.date}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-lg font-semibold mr-2">{metric.value}</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${metric.status === 'normal' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {metric.status}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patientActions.map((action, index) => (
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

export default PatientDashboard;