import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiX, 
  FiFileText, 
  FiCalendar, 
  FiUser, 
  FiEdit, 
  FiTrash2, 
  FiDownload, 
  FiShare2,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiInfo
} from 'react-icons/fi';
import { formatDate } from '../../utils/dateUtils';

const LabDetails = ({ lab, onClose, onEdit, onDelete, onShare }) => {
  const { currentUser } = useAuth();
  const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'admin';
  
  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'stat':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            STAT
          </span>
        );
      case 'urgent':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Urgent
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Routine
          </span>
        );
    }
  };
  
  const getStatusBadge = (lab) => {
    if (!lab.resultsAvailable) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <FiClock className="mr-1" />
          Pending
        </span>
      );
    } else if (lab.hasAbnormalResults) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <FiAlertTriangle className="mr-1" />
          Abnormal
        </span>
      );
    } else {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <FiCheckCircle className="mr-1" />
          Normal
        </span>
      );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FiFileText className="mr-2" />
            Lab Result Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {lab.testName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lab.testType}
              </p>
            </div>
            <div className="flex flex-col items-end mt-2 md:mt-0">
              <div className="flex space-x-2">
                {getStatusBadge(lab)}
                {getUrgencyBadge(lab.urgency)}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                <p>
                  {formatDate(lab.testDate, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Patient
              </h4>
              <p className="text-base text-gray-900 dark:text-white flex items-center">
                <FiUser className="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                {lab.patient?.name || 'Unknown'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Ordered By
              </h4>
              <p className="text-base text-gray-900 dark:text-white flex items-center">
                <FiUser className="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                Dr. {lab.orderedBy?.name || 'Unknown'}
              </p>
            </div>
          </div>
          
          {lab.notes && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Notes
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {lab.notes}
                </p>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Results
            </h4>
            
            {!lab.resultsAvailable ? (
              <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiClock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Results are pending. Please check back later.
                    </p>
                  </div>
                </div>
              </div>
            ) : lab.results.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No detailed results available.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Test
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Result
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Normal Range
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {lab.results.map((result, index) => (
                      <tr key={index} className={result.isAbnormal ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {result.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {result.value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {result.normalRange || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {result.isAbnormal ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Abnormal
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {lab.hasAbnormalResults && lab.resultsAvailable && (
            <div className="mb-6">
              <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This lab result contains abnormal values. Please consult with your healthcare provider.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap justify-end space-x-2 space-y-2 sm:space-y-0">
            <button
              onClick={() => {
                // In a real app, this would download a PDF of the lab result
                alert('Downloading lab result...');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiDownload className="mr-2" />
              Download
            </button>
            
            <button
              onClick={onShare}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiShare2 className="mr-2" />
              Share
            </button>
            
            {isDoctor && (
              <>
                <button
                  onClick={onEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FiEdit className="mr-2" />
                  Edit
                </button>
                
                <button
                  onClick={onDelete}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FiTrash2 className="mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDetails; 