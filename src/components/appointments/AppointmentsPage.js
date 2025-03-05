import React from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiCalendar, FiList } from 'react-icons/fi';

// Inline PageLayout component to avoid import issues
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

const AppointmentsPage = () => {
  // Example action buttons for the header
  const actionButtons = (
    <Link 
      to="/appointments/new" 
      className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm"
    >
      <FiPlus className="mr-2" />
      New Appointment
    </Link>
  );

  return (
    <PageLayout
      title="Appointments"
      description="View and manage your upcoming appointments."
      bgColor="bg-blue-600"
      actions={actionButtons}
    >
      <div className="mb-6">
        <div className="flex space-x-4 mb-6">
          <Link 
            to="/appointments" 
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
          >
            <FiList className="mr-2" />
            List View
          </Link>
          <Link 
            to="/appointments/calendar" 
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
          >
            <FiCalendar className="mr-2" />
            Calendar View
          </Link>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            This page is under development. Check back soon for appointment management features.
          </p>
          
          <div className="mt-6 flex justify-center space-x-4">
            <Link 
              to="/appointments/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Schedule Appointment
            </Link>
            
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
              View Past Appointments
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AppointmentsPage;