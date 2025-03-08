import React, { useState, useEffect } from 'react';
import { useMedicalRecords } from '../contexts/MedicalRecordsContext';

const MedicalRecords = ({ patientId }) => {
  const { records, loading, error, fetchRecords } = useMedicalRecords();
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchRecords(patientId);
  }, [patientId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    try {
      await uploadDocument(records[0].id, file);
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  if (loading) return <div>Loading medical records...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="medical-records">
      <h2>Medical Records</h2>
      
      <form onSubmit={handleUpload}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".pdf,.doc,.docx,image/*"
        />
        <button type="submit">Upload Document</button>
      </form>

      {records.length === 0 ? (
        <p>No medical records found</p>
      ) : (
        <div className="records-list">
          {records.map(record => (
            <div key={record.id} className="record-item">
              <h3>{record.title}</h3>
              <p>Date: {new Date(record.date).toLocaleDateString()}</p>
              <p>Type: {record.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;