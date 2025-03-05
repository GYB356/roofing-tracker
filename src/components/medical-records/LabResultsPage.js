import React from 'react';
import { FiDownload, FiFilter, FiFile, FiEye } from 'react-icons/fi';

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

const LabResultsPage = () => {
  const actionButtons = (
    <div className="flex space-x-2">
      <button className="bg-white text-green-600 hover:bg-green-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiFilter className="mr-2" />
        Filter
      </button>
      <button className="bg-green-700 text-white hover:bg-green-800 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiDownload className="mr-2" />
        Download All
      </button>
    </div>
  );

  // Sample lab results data
  const labResults = [
    {
      id: 'LR-2024-001',
      name: 'Complete Blood Count (CBC)',
      date: '2024-01-15',
      provider: 'LabCorp',
      status: 'Normal',
      viewed: true
    },
    {
      id: 'LR-2023-018',
      name: 'Lipid Panel',
      date: '2023-12-10',
      provider: 'Quest Diagnostics',
      status: 'Review',
      viewed: false
    },
    {
      id: 'LR-2023-012',
      name: 'HbA1c Test',
      date: '2023-11-05',
      provider: 'LabCorp',
      status: 'Normal',
      viewed: true
    },
    {
      id: 'LR-2023-008',
      name: 'Thyroid Panel',
      date: '2023-09-22',
      provider: 'Quest Diagnostics',
      status: 'Normal',
      viewed: true
    }
  ];

  return (
    <PageLayout
      title="Lab Results"
      description="View and manage your laboratory test results."
      bgColor="bg-green-600"
      textColor="text-green-100"
      actions={actionButtons}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Lab Results</h2>
          <div className="flex space-x-2">
            <select className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <option>All Time</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
            <select className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <option>All Results</option>
              <option>Normal</option>
              <option>Abnormal</option>
              <option>Unreviewed</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Test</th>
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Date</th>
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Provider</th>
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Status</th>
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labResults.map((result, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                    <div className="flex items-center">
                      <FiFile className="text-green-500 mr-2" />
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{result.id}</div>
                      </div>
                      {!result.viewed && (
                        <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full" title="New result"></span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{result.date}</td>
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{result.provider}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === 'Normal' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="View">
                        <FiEye />
                      </button>
                      <button className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Download">
                        <FiDownload />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for more lab results management features.
        </p>
      </div>
    </PageLayout>
  );
};

export default LabResultsPage;