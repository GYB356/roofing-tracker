import React from 'react';
import { FiVideo, FiPlus } from 'react-icons/fi';

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

const TelemedicinePage = () => {
  const actionButtons = (
    <button className="bg-white text-red-600 hover:bg-red-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
      <FiPlus className="mr-2" />
      New Consultation
    </button>
  );

  return (
    <PageLayout
      title="Telemedicine"
      description="Start or join a virtual consultation."
      bgColor="bg-red-600"
      textColor="text-red-100"
      actions={actionButtons}
    >
      <div className="text-center py-8">
        <FiVideo className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Scheduled Consultations</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have any upcoming telemedicine appointments.
        </p>
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium">
          Schedule a Consultation
        </button>
      </div>
      
      <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for telemedicine features.
        </p>
      </div>
    </PageLayout>
  );
};

export default TelemedicinePage;