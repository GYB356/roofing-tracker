// contexts/MedicalRecordsContext.js - Fixed await syntax
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.js';
import { hasPermission, secureStorage } from '../utils/security.js';

const MedicalRecordsContext = createContext();

export const useMedicalRecords = () => {
  return useContext(MedicalRecordsContext);
};

export const MedicalRecordsProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Helper function to log HIPAA-related actions
  const logHIPAAAction = (action, details) => {
    // Return a promise to allow async/await usage
    return new Promise((resolve) => {
      console.log(`HIPAA Audit Log: ${action}`, details);
      // Here you would normally send this to your server
      // For now, we'll just simulate it
      setTimeout(resolve, 100);
    });
  };

  // Fetch all records for the current user
  const fetchRecords = () => {
    setLoading(true);
    setError(null);

    // Simulated API call
    setTimeout(() => {
      try {
        // For demo purposes, we'll just use some sample data
        const sampleRecords = [
          {
            id: '1',
            patientId: currentUser?.id || 'user123',
            title: 'Annual Physical',
            date: '2023-05-15',
            doctor: 'Dr. Smith',
            type: 'examination',
            notes: 'Regular checkup, all vitals normal.',
            attachments: []
          },
          {
            id: '2',
            patientId: currentUser?.id || 'user123',
            title: 'Flu Vaccination',
            date: '2023-10-01',
            doctor: 'Dr. Johnson',
            type: 'vaccination',
            notes: 'Annual flu shot administered.',
            attachments: []
          }
        ];
        
        setRecords(sampleRecords);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch medical records');
        setLoading(false);
      }
    }, 1000);
  };

  // Get a specific record by ID
  const getRecordById = async (recordId) => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      // In a real app, this would be an API call
      setTimeout(() => {
        const record = records.find(r => r.id === recordId);
        
        if (record) {
          // Log this access for HIPAA auditing
          logHIPAAAction('access_medical_record', {
            recordId,
            patientId: record.patientId,
            accessType: 'detail',
            timestamp: new Date().toISOString()
          }).then(() => {
            setLoading(false);
            resolve(record);
          });
        } else {
          setError('Record not found');
          setLoading(false);
          reject(new Error('Record not found'));
        }
      }, 500);
    });
  };

  // Add a new medical record
  const addRecord = (recordData) => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      // Check permissions
      if (!hasPermission(currentUser, 'create_medical_record')) {
        setError('You do not have permission to create medical records');
        setLoading(false);
        reject(new Error('Permission denied'));
        return;
      }

      // In a real app, this would be an API call
      setTimeout(() => {
        try {
          // Create a new record with an ID
          const newRecord = {
            id: `rec_${Date.now()}`,
            patientId: currentUser?.id,
            ...recordData,
            createdAt: new Date().toISOString()
          };
          
          // Update state
          setRecords([...records, newRecord]);
          
          // Log this for HIPAA auditing
          logHIPAAAction('create_medical_record', {
            recordId: newRecord.id,
            patientId: newRecord.patientId,
            timestamp: new Date().toISOString()
          }).then(() => {
            setLoading(false);
            resolve(newRecord);
          });
        } catch (err) {
          setError('Failed to create medical record');
          setLoading(false);
          reject(err);
        }
      }, 1000);
    });
  };

  // Update an existing record
  const updateRecord = (recordId, recordData) => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      // Check permissions
      if (!hasPermission(currentUser, 'update_medical_record')) {
        setError('You do not have permission to update medical records');
        setLoading(false);
        reject(new Error('Permission denied'));
        return;
      }

      // In a real app, this would be an API call
      setTimeout(() => {
        try {
          // Find the record to update
          const index = records.findIndex(r => r.id === recordId);
          
          if (index === -1) {
            throw new Error('Record not found');
          }
          
          // Create updated record
          const updatedRecord = {
            ...records[index],
            ...recordData,
            updatedAt: new Date().toISOString()
          };
          
          // Update state
          const newRecords = [...records];
          newRecords[index] = updatedRecord;
          setRecords(newRecords);
          
          // Log this for HIPAA auditing
          logHIPAAAction('update_medical_record', {
            recordId,
            patientId: updatedRecord.patientId,
            timestamp: new Date().toISOString()
          }).then(() => {
            setLoading(false);
            resolve(updatedRecord);
          });
        } catch (err) {
          setError('Failed to update medical record');
          setLoading(false);
          reject(err);
        }
      }, 1000);
    });
  };

  // Delete a record
  const deleteRecord = (recordId) => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      // Check permissions
      if (!hasPermission(currentUser, 'delete_medical_record')) {
        setError('You do not have permission to delete medical records');
        setLoading(false);
        reject(new Error('Permission denied'));
        return;
      }

      // In a real app, this would be an API call
      setTimeout(() => {
        try {
          // Find the record
          const record = records.find(r => r.id === recordId);
          
          if (!record) {
            throw new Error('Record not found');
          }
          
          // Update state
          setRecords(records.filter(r => r.id !== recordId));
          
          // Log this for HIPAA auditing
          logHIPAAAction('delete_medical_record', {
            recordId,
            patientId: record.patientId,
            timestamp: new Date().toISOString()
          }).then(() => {
            setLoading(false);
            resolve({ success: true });
          });
        } catch (err) {
          setError('Failed to delete medical record');
          setLoading(false);
          reject(err);
        }
      }, 1000);
    });
  };

  // Define uploadDocument function
  const uploadDocument = (documentData) => {
    return new Promise((resolve, reject) => {
      // Simulate document upload
      setTimeout(() => {
        console.log('Document uploaded:', documentData);
        resolve({ success: true });
      }, 1000);
    });
  };

  // Fix useEffect dependencies
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const value = {
    records,
    loading,
    error,
    fetchRecords,
    getRecordById,
    addRecord,
    updateRecord,
    deleteRecord,
    uploadDocument
  };

  return (
    <MedicalRecordsContext.Provider value={value}>
      {children}
    </MedicalRecordsContext.Provider>
  );
};

export default MedicalRecordsContext;