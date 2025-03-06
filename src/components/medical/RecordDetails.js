import React from 'react';
import { FiX, FiDownload, FiEdit2, FiTrash2, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const RecordDetails = ({ record, onClose, onEdit, onDelete }) => {
  const { currentUser } = useAuth();
  if (!record) return null;

  // HIPAA compliance check
  const hasAccess = () => {
    if (!currentUser) return false;
    const allowedRoles = ['admin', 'doctor', 'nurse'];
    
    if (allowedRoles.includes(currentUser.role)) {
      if (['doctor', 'nurse'].includes(currentUser.role)) {
        return currentUser.hipaaConsent && currentUser.hipaaConsent.status === 'accepted';
      }
      return true;
    }
    return false;
  };

  const handleDownload = async () => {
    try {
      if (!hasAccess()) {
        throw new Error('You do not have permission to download this record');
      }
      // TODO: Implement secure document download with encryption
      const response = await fetch(`/api/records/${record.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download record');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-record-${record.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading record:', error);
      alert(error.message);
    }
  };

  if (!hasAccess()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex items-center text-red-600 mb-4">
            <FiAlertTriangle className="w-6 h-6 mr-2" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
          </div>
          <p className="text-gray-600 mb-4">
            You do not have permission to view this medical record. This feature is only available to authorized healthcare providers.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Medical Record Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Patient Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.patientName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.dateOfBirth}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Medical Record Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.mrn}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Primary Care Physician</dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.primaryPhysician}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Insurance Provider</dt>
                  <dd className="mt-1 text-sm text-gray-900">{record.insuranceProvider}</dd>
                </div>
              </dl>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">Vital Signs</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Blood Pressure</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {record.vitalSigns?.bloodPressure || 'N/A'}
                      <span className="text-xs text-gray-500 ml-1">mmHg</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Heart Rate</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {record.vitalSigns?.heartRate || 'N/A'}
                      <span className="text-xs text-gray-500 ml-1">bpm</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Temperature</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {record.vitalSigns?.temperature || 'N/A'}
                      <span className="text-xs text-gray-500 ml-1">°F</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Respiratory Rate</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {record.vitalSigns?.respiratoryRate || 'N/A'}
                      <span className="text-xs text-gray-500 ml-1">breaths/min</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Oxygen Saturation</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {record.vitalSigns?.oxygenSaturation || 'N/A'}
                      <span className="text-xs text-gray-500 ml-1">%</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {record.vitalSigns?.lastUpdated ? new Date(record.vitalSigns.lastUpdated).toLocaleString() : 'N/A'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record Details</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600">
                  {record.details || 'No detailed information available.'}
                </p>
              </div>

              {record.attachments && record.attachments.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
                  <ul className="divide-y divide-gray-200">
                    {record.attachments.map((attachment, index) => (
                      <li key={index} className="py-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">{attachment.name}</span>
                        <button
                          onClick={() => handleDownload(attachment)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {record.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{record.notes}</p>
              </div>
            </div>
          )}

          {record.warnings && (
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-center">
                <FiAlertTriangle className="text-yellow-400 mr-3" />
                <p className="text-sm text-yellow-700">{record.warnings}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiEdit2 className="-ml-1 mr-2 h-4 w-4" />
            Edit Record
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiTrash2 className="-ml-1 mr-2 h-4 w-4" />
            Delete Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordDetails;