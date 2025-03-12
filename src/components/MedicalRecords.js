// components/MedicalRecords.js - Fixed uploadDocument undefined
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMedicalRecords, uploadDocument } from '../contexts/MedicalRecordsContext.js';

const MedicalRecords = () => {
  const { records, loading, error, fetchRecords } = useMedicalRecords();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Define the uploadDocument function
  const uploadDocument = async (recordId, file) => {
    try {
      // In a real app, you would call an API endpoint here
      console.log(`Uploading file ${file.name} to record ${recordId}`);
      
      // Mock successful upload
      setTimeout(() => {
        alert(`File ${file.name} uploaded successfully`);
        setShowUploadModal(false);
        setFile(null);
        // Refresh records after upload
        fetchRecords();
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    navigate(`/medical-records/${record.id}`);
  };

  const handleUpload = (record) => {
    setSelectedRecord(record);
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitUpload = (e) => {
    e.preventDefault();
    if (!file || !selectedRecord) return;
    
    uploadDocument(selectedRecord.id, file);
  };

  if (loading) return <div>Loading medical records...</div>;
  if (error) return <div>Error loading records: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Medical Records</h1>
      
      {records.length === 0 ? (
        <div className="bg-gray-100 p-4 rounded">
          <p>No medical records found.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {records.map((record) => (
              <li key={record.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{record.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString()} - {record.doctor}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{record.notes}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewRecord(record)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleUpload(record)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Upload
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            <p className="mb-4">Upload a document to: {selectedRecord.title}</p>
            
            <form onSubmit={handleSubmitUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={!file}
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;