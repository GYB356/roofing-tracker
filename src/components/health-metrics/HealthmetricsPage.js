import React from 'react';
import { FiActivity, FiPlus } from 'react-icons/fi';

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

const HealthMetricsPage = () => {
  const actionButtons = (
    <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
      <FiPlus className="mr-2" />
      Add Metrics
    </button>
  );

  return (
    <PageLayout
      title="Health Metrics"
      description="Track your health statistics and progress."
      bgColor="bg-indigo-600"
      textColor="text-indigo-100"
      actions={actionButtons}
    >
      <div className="text-center py-8">
        <FiActivity className="mx-auto h-16 w-16 text-indigo-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Health Data Yet</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Start tracking your health metrics to view your progress.
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium">
          Add First Metric
        </button>
      </div>
      
      <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for health tracking features.
        </p>
      </div>
    </PageLayout>
  );
};

export default HealthMetricsPage;