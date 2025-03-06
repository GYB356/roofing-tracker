import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiFileText, FiLock, FiAlertTriangle } from 'react-icons/fi';

const MedicalRecords = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Check if user has required permissions
  const hasAccess = () => {
    if (!currentUser) return false;
    const allowedRoles = ['admin', 'doctor', 'nurse'];
    
    if (allowedRoles.includes(currentUser.role)) {
      // Additional HIPAA compliance check
      if (['doctor', 'nurse'].includes(currentUser.role)) {
        return currentUser.hipaaConsent && currentUser.hipaaConsent.status === 'accepted';
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch medical records
        // This is a placeholder for demonstration
        const mockRecords = [
          {
            id: 1,
            patientName: 'John Doe',
            recordType: 'Lab Result',
            date: '2024-01-15',
            doctor: 'Dr. Smith',
            status: 'Complete'
          },
          {
            id: 2,
            patientName: 'Jane Smith',
            recordType: 'Imaging',
            date: '2024-01-14',
            doctor: 'Dr. Johnson',
            status: 'Pending Review'
          }
        ];

        setRecords(mockRecords);
        setError('');
      } catch (err) {
        setError('Failed to fetch medical records. Please try again later.');
        console.error('Error fetching records:', err);
      } finally {
        setLoading(false);
      }
    };

    if (hasAccess()) {
      fetchRecords();
    }
  }, [currentUser]);

  if (!hasAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center text-red-600 mb-4">
            <FiLock className="w-6 h-6 mr-2" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
          </div>
          <p className="text-gray-600">
            You do not have permission to view medical records. This feature is only available to authorized healthcare providers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FiFileText className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-semibold text-gray-800">Medical Records</h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-center">
                <FiAlertTriangle className="text-red-500 mr-3" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.patientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.recordType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.doctor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Complete' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;