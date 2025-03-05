import React from 'react';
import { Link } from 'react-router-dom';
import { FiFile, FiDownload, FiUpload } from 'react-icons/fi';

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

const MedicalRecordsPage = () => {
  // Action buttons for the header
  const actionButtons = (
    <div className="flex space-x-2">
      <button className="bg-white text-green-600 hover:bg-green-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiUpload className="mr-2" />
        Upload Records
      </button>
      <button className="bg-green-700 text-white hover:bg-green-800 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiDownload className="mr-2" />
        Download All
      </button>
    </div>
  );

  return (
    <PageLayout
      title="Medical Records"
      description="Access your medical history and documents."
      bgColor="bg-green-600"
      textColor="text-green-100"
      actions={actionButtons}
    >
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/medical-records"
            className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40 rounded-lg flex items-center"
          >
            <FiFile className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Health Summary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Overview of your health records</p>
            </div>
          </Link>
          
          <Link 
            to="/medical-records/medications"
            className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40 rounded-lg flex items-center"
          >
            <FiFile className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Medications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Current and past medications</p>
            </div>
          </Link>
          
          <Link 
            to="/medical-records/lab-results"
            className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40 rounded-lg flex items-center"
          >
            <FiFile className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Lab Results</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Test and lab results</p>
            </div>
          </Link>
        </div>
        
        <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            This page is under development. Check back soon for medical records management features.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default MedicalRecordsPage;