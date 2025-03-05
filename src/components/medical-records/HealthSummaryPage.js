import React from 'react';
import { FiHeart, FiActivity, FiThermometer, FiDroplet, FiDownload, FiPrinter } from 'react-icons/fi';

// Inline PageLayout component
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
      
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

const HealthSummaryPage = () => {
  const actionButtons = (
    <div className="flex space-x-2">
      <button className="bg-white text-green-600 hover:bg-green-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiPrinter className="mr-2" />
        Print
      </button>
      <button className="bg-green-700 text-white hover:bg-green-800 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiDownload className="mr-2" />
        Download
      </button>
    </div>
  );

  // Sample health metrics
  const vitals = [
    { name: 'Blood Pressure', value: '120/80 mmHg', date: '2024-02-15', icon: <FiHeart className="text-red-500" /> },
    { name: 'Heart Rate', value: '72 bpm', date: '2024-02-15', icon: <FiActivity className="text-red-500" /> },
    { name: 'Temperature', value: '98.6 °F', date: '2024-02-15', icon: <FiThermometer className="text-orange-500" /> },
    { name: 'Blood Glucose', value: '90 mg/dL', date: '2024-02-10', icon: <FiDroplet className="text-blue-500" /> }
  ];

  return (
    <PageLayout
      title="Health Summary"
      description="Overview of your health records and vital statistics."
      bgColor="bg-green-600"
      textColor="text-green-100"
      actions={actionButtons}
    >
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Vitals</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vitals.map((vital, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="mr-2">
                  {vital.icon}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">{vital.name}</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{vital.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: {vital.date}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Medical History</h2>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Provider</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">2024-01-15</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Annual Physical</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">Dr. Sarah Johnson</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">Routine checkup, all results normal</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">2023-11-10</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Vaccination</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">Dr. Michael Lee</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">Flu vaccine administered</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">2023-08-22</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Dental Checkup</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">Dr. Emily Watson</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">Routine cleaning, no cavities</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for more detailed health summary features.
        </p>
      </div>
    </PageLayout>
  );
};

export default HealthSummaryPage;