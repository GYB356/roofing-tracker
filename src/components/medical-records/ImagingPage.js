import React from 'react';
import { FiImage, FiDownload, FiEye, FiFilter, FiShare2 } from 'react-icons/fi';

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

const ImagingPage = () => {
  const actionButtons = (
    <div className="flex space-x-2">
      <button className="bg-white text-green-600 hover:bg-green-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiFilter className="mr-2" />
        Filter
      </button>
      <button className="bg-green-700 text-white hover:bg-green-800 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiShare2 className="mr-2" />
        Share
      </button>
    </div>
  );

  // Sample imaging studies
  const imagingStudies = [
    {
      id: 'IMG-2024-003',
      name: 'Chest X-Ray',
      date: '2024-01-15',
      provider: 'City General Hospital',
      type: 'X-Ray',
      bodyPart: 'Chest',
      status: 'Available'
    },
    {
      id: 'IMG-2023-018',
      name: 'MRI - Right Knee',
      date: '2023-11-22',
      provider: 'Orthopedic Specialty Center',
      type: 'MRI',
      bodyPart: 'Knee',
      status: 'Available'
    },
    {
      id: 'IMG-2023-012',
      name: 'Abdominal Ultrasound',
      date: '2023-10-05',
      provider: 'City General Hospital',
      type: 'Ultrasound',
      bodyPart: 'Abdomen',
      status: 'Available'
    },
    {
      id: 'IMG-2023-009',
      name: 'CT Scan - Head',
      date: '2023-08-17',
      provider: 'Neurology Center',
      type: 'CT Scan',
      bodyPart: 'Head',
      status: 'Available'
    }
  ];

  return (
    <PageLayout
      title="Imaging"
      description="View and manage your medical imaging studies."
      bgColor="bg-green-600"
      textColor="text-green-100"
      actions={actionButtons}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Imaging Studies</h2>
          <div className="flex space-x-2">
            <select className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <option>All Time</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
            <select className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <option>All Types</option>
              <option>X-Ray</option>
              <option>MRI</option>
              <option>CT Scan</option>
              <option>Ultrasound</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {imagingStudies.map((study, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                <div className="flex items-center">
                  <FiImage className="text-green-600 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">{study.name}</h3>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
                  {study.type}
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                    <p className="text-sm text-gray-900 dark:text-white">{study.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Provider</p>
                    <p className="text-sm text-gray-900 dark:text-white">{study.provider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Body Part</p>
                    <p className="text-sm text-gray-900 dark:text-white">{study.bodyPart}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
                    <p className="text-sm text-gray-900 dark:text-white">{study.id}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <button className="px-3 py-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <FiEye className="inline mr-1" /> View
                  </button>
                  <button className="px-3 py-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <FiDownload className="inline mr-1" /> Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for more imaging management features.
        </p>
      </div>
    </PageLayout>
  );
};

export default ImagingPage;