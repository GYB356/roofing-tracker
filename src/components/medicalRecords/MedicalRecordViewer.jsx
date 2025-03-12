import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  DocumentTextIcon, 
  DownloadIcon, 
  ArrowLeftIcon,
  ExclamationCircleIcon,
  DocumentDuplicateIcon,
  PaperClipIcon,
} from '@heroicons/react/outline';
import { medicalRecordsAPI } from '../../utils/api';

const MedicalRecordViewer = () => {
  const { recordId } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const fetchMedicalRecord = async () => {
      try {
        setLoading(true);
        const response = await medicalRecordsAPI.getMedicalRecordById(recordId);
        setRecord(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching medical record:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load medical record. Please try again later.'
        );
        setLoading(false);
      }
    };
    
    fetchMedicalRecord();
  }, [recordId]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMMM d, yyyy');
  };
  
  // Format date with time for display
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMMM d, yyyy, h:mm a');
  };
  
  // Handle downloading attachments
  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const response = await medicalRecordsAPI.downloadAttachment(recordId, attachmentId);
      
      // Create a blob from the response data
      const blob = new Blob([response.data]);
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading attachment:', err);
      alert('Failed to download attachment. Please try again later.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
            <div className="mt-4">
              <Link
                to="/medical-records"
                className="text-sm font-medium text-red-800 hover:text-red-700"
              >
                &larr; Back to Medical Records
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!record) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Medical record not found.</p>
        <Link
          to="/medical-records"
          className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Medical Records
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-800">
            Medical Record: {record.recordType}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateTime(record.recordDate)}
          </p>
        </div>
        <div>
          <Link
            to="/medical-records"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
            <button
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'vitals'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('vitals')}
            >
              Vital Signs
            </button>
          )}
          {record.labResults && record.labResults.length > 0 && (
            <button
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'labs'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('labs')}
            >
              Lab Results
            </button>
          )}
          {record.imaging && record.imaging.length > 0 && (
            <button
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'imaging'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('imaging')}
            >
              Imaging
            </button>
          )}
          {record.attachments && record.attachments.length > 0 && (
            <button
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'attachments'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('attachments')}
            >
              Attachments
            </button>
          )}
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Patient Information</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span>{' '}
                    {record.patientId?.userId?.fullName || 'N/A'}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Provider:</span>{' '}
                    {record.provider?.fullName || 'N/A'}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Record Date:</span>{' '}
                    {formatDate(record.recordDate)}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Record Type:</span>{' '}
                    {record.recordType}
                  </p>
                </div>
              </div>
              
              {record.appointmentId && (
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3">Appointment Details</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm">
                      <span className="font-medium">Date:</span>{' '}
                      {formatDateTime(record.appointmentId.scheduledDate)}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Type:</span>{' '}
                      {record.appointmentId.appointmentType}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.appointmentId.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.appointmentId.status}
                      </span>
                    </p>
                    <Link
                      to={`/appointments/${record.appointmentId._id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block"
                    >
                      View Appointment Details
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {record.chiefComplaint && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Chief Complaint</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm">{record.chiefComplaint}</p>
                </div>
              </div>
            )}
            
            {record.diagnosis && record.diagnosis.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Diagnosis</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <ul className="space-y-2">
                    {record.diagnosis.map((diagnosis, index) => (
                      <li key={index} className="text-sm">
                        <span className="font-medium">{diagnosis.code}:</span>{' '}
                        {diagnosis.description} ({diagnosis.type})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {record.assessmentNotes && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Assessment</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm">{record.assessmentNotes}</p>
                </div>
              </div>
            )}
            
            {record.planNotes && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Plan</h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm">{record.planNotes}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'vitals' && record.vitalSigns && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Vital Signs</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {record.vitalSigns.temperature && (
                  <div>
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="text-lg font-medium">{record.vitalSigns.temperature} °C</p>
                  </div>
                )}
                
                {record.vitalSigns.heartRate && (
                  <div>
                    <p className="text-xs text-gray-500">Heart Rate</p>
                    <p className="text-lg font-medium">{record.vitalSigns.heartRate} bpm</p>
                  </div>
                )}
                
                {record.vitalSigns.respiratoryRate && (
                  <div>
                    <p className="text-xs text-gray-500">Respiratory Rate</p>
                    <p className="text-lg font-medium">{record.vitalSigns.respiratoryRate} breaths/min</p>
                  </div>
                )}
                
                {(record.vitalSigns.bloodPressureSystolic && record.vitalSigns.bloodPressureDiastolic) && (
                  <div>
                    <p className="text-xs text-gray-500">Blood Pressure</p>
                    <p className="text-lg font-medium">
                      {record.vitalSigns.bloodPressureSystolic}/{record.vitalSigns.bloodPressureDiastolic} mmHg
                    </p>
                  </div>
                )}
                
                {record.vitalSigns.oxygenSaturation && (
                  <div>
                    <p className="text-xs text-gray-500">Oxygen Saturation</p>
                    <p className="text-lg font-medium">{record.vitalSigns.oxygenSaturation}%</p>
                  </div>
                )}
                
                {record.vitalSigns.height && (
                  <div>
                    <p className="text-xs text-gray-500">Height</p>
                    <p className="text-lg font-medium">{record.vitalSigns.height} cm</p>
                  </div>
                )}
                
                {record.vitalSigns.weight && (
                  <div>
                    <p className="text-xs text-gray-500">Weight</p>
                    <p className="text-lg font-medium">{record.vitalSigns.weight} kg</p>
                  </div>
                )}
                
                {record.vitalSigns.bmi && (
                  <div>
                    <p className="text-xs text-gray-500">BMI</p>
                    <p className="text-lg font-medium">{record.vitalSigns.bmi}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'labs' && record.labResults && record.labResults.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Laboratory Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Normal Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interpretation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {record.labResults.map((lab, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lab.testName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lab.result}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lab.normalRange}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lab.units}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lab.interpretation === 'Normal' 
                            ? 'bg-green-100 text-green-800' 
                            : lab.interpretation === 'Abnormal'
                              ? 'bg-yellow-100 text-yellow-800'
                              : lab.interpretation === 'Critical'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lab.interpretation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'imaging' && record.imaging && record.imaging.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Imaging Studies</h3>
            <div className="space-y-6">
              {record.imaging.map((image, index) => (
                <div key={index} className="bg-gray-50 rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">{image.studyType}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(image.datePerformed)} • {image.bodyPart}
                      </p>
                    </div>
                    {image.imageUrls && image.imageUrls.length > 0 && (
                      <button
                        className="text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => {/* Handle viewing images */}}
                      >
                        View Images
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Findings:</span> {image.findings}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-medium">Impression:</span> {image.impression}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      <span className="font-medium">Performed by:</span> {image.performedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'attachments' && record.attachments && record.attachments.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Attachments</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <ul className="divide-y divide-gray-200">
                {record.attachments.map((attachment, index) => (
                  <li key={index} className="py-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(attachment.uploadDate)} • {attachment.fileSize} KB
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => handleDownloadAttachment(attachment._id, attachment.fileName)}
                    >
                      <DownloadIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordViewer; 