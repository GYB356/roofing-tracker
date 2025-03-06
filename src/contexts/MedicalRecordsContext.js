// src/contexts/MedicalRecordsContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { encryptData, decryptData, logHIPAAAction, checkHIPAAAccess, sanitizeForLogging } from '../utils/hipaaCompliance';

const MedicalRecordsContext = createContext(null);

export const MedicalRecordsProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();
  
  // Load medical records from secure storage
  useEffect(() => {
    const loadRecords = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get encrypted records from secure storage
        const encryptedRecords = localStorage.getItem('medicalRecords') || '[]';
        const allRecords = JSON.parse(decryptData(encryptedRecords));
        
        // Filter records based on HIPAA permissions
        let userRecords = [];
        
        if (checkHIPAAAccess(currentUser)) {
          if (currentUser.role === 'admin') {
            // Admins can see all records
            userRecords = allRecords;
          } else if (['doctor', 'nurse'].includes(currentUser.role)) {
            // Healthcare providers can see their patients' records
            userRecords = allRecords.filter(record => 
              record.providerId === currentUser.id ||
              record.assignedProviders?.includes(currentUser.id)
            );
          }
        } else if (currentUser.role === 'patient') {
          // Patients can only see their own records
          userRecords = allRecords.filter(record => record.patientId === currentUser.id);
        }
        
        // Log this access for HIPAA auditing
        await logHIPAAAction('access_medical_records', {
          recordCount: userRecords.length,
          accessType: 'list',
          userRole: currentUser.role
        }, currentUser.id);
        
        setRecords(userRecords);
      } catch (err) {
        console.error('Failed to load medical records:', err);
        setError('Failed to load medical records. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadRecords();
  }, [currentUser, isAuthenticated]);
  
  // Get a specific medical record by ID
  const getRecordById = (recordId) => {
    const record = records.find(r => r.id === recordId);
    
    if (record) {
      // Log this access for HIPAA auditing
      await logHIPAAAction('access_medical_record', {
        recordId,
        patientId: record.patientId,
        accessType: 'detail',
        userRole: currentUser.role
      }, currentUser.id);
    }
    
    return record;
  };
  
  // Create a new medical record
  const createRecord = async (recordData) => {
    try {
      // Check permissions
      if (!hasPermission(currentUser, 'write_medical') && 
          !(currentUser.role === 'patient' && recordData.patientId === currentUser.id)) {
        throw new Error('You do not have permission to create medical records');
      }
      
      // Create new record
      const newRecord = {
        ...recordData,
        id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id
      };
      
      // Get all records and add the new one
      const allRecords = secureStorage.getItem('medicalRecords') || [];
      allRecords.push(newRecord);
      
      // Encrypt and save to storage
      const encryptedRecords = encryptData(allRecords);
      localStorage.setItem('medicalRecords', encryptedRecords);
      
      // Update state
      setRecords(prevRecords => [...prevRecords, newRecord]);
      
      // Log this action for HIPAA auditing
      await logHIPAAAction('create_medical_record', sanitizeForLogging({
        recordId: newRecord.id,
        patientId: newRecord.patientId,
        recordType: newRecord.type,
        userRole: currentUser.role
      }), currentUser.id);
      
      return { success: true, record: newRecord };
    } catch (err) {
      console.error('Failed to create medical record:', err);
      return { 
        success: false, 
        message: err.message || 'Failed to create medical record. Please try again.'
      };
    }
  };
  
  // Update an existing medical record
  const updateRecord = async (recordId, updates) => {
    try {
      // Find the record
      const allRecords = secureStorage.getItem('medicalRecords') || [];
      const recordIndex = allRecords.findIndex(r => r.id === recordId);
      
      if (recordIndex === -1) {
        throw new Error('Medical record not found');
      }
      
      const record = allRecords[recordIndex];
      
      // Check permissions
      if (!hasPermission(currentUser, 'write_medical') && 
          !(currentUser.role === 'patient' && record.patientId === currentUser.id)) {
        throw new Error('You do not have permission to update this medical record');
      }
      
      // Create updated record
      const updatedRecord = {
        ...record,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id
      };
      
      // Update in all records
      allRecords[recordIndex] = updatedRecord;
      secureStorage.setItem('medicalRecords', allRecords);
      
      // Update state
      setRecords(prevRecords => {
        const newRecords = [...prevRecords];
        const stateRecordIndex = newRecords.findIndex(r => r.id === recordId);
        
        if (stateRecordIndex !== -1) {
          newRecords[stateRecordIndex] = updatedRecord;
        }
        
        return newRecords;
      });
      
      // Log this action for HIPAA auditing
      await logHIPAAAction('update_medical_record', sanitizeForLogging({
        recordId: updatedRecord.id,
        patientId: updatedRecord.patientId,
        fields: Object.keys(updates),
        userRole: currentUser.role
      }), currentUser.id);
      
      return { success: true, record: updatedRecord };
    } catch (err) {
      console.error('Failed to update medical record:', err);
      return { 
        success: false, 
        message: err.message || 'Failed to update medical record. Please try again.'
      };
    }
  };
  
  // Delete a medical record (soft delete)
  const deleteRecord = async (recordId) => {
    try {
      // Find the record
      const allRecords = secureStorage.getItem('medicalRecords') || [];
      const recordIndex = allRecords.findIndex(r => r.id === recordId);
      
      if (recordIndex === -1) {
        throw new Error('Medical record not found');
      }
      
      const record = allRecords[recordIndex];
      
      // Check permissions - only admins can delete records
      if (!hasPermission(currentUser, 'delete_all')) {
        throw new Error('You do not have permission to delete medical records');
      }
      
      // Soft delete by marking as deleted
      const updatedRecord = {
        ...record,
        deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser.id
      };
      
      allRecords[recordIndex] = updatedRecord;
      secureStorage.setItem('medicalRecords', allRecords);
      
      // Update state - remove from current view
      setRecords(prevRecords => prevRecords.filter(r => r.id !== recordId));
      
      // Log this action for HIPAA auditing
      await logHIPAAAction('delete_medical_record', sanitizeForLogging({
        recordId: record.id,
        patientId: record.patientId,
        recordType: record.type,
        userRole: currentUser.role
      }), currentUser.id);
      
      return { success: true };
    } catch (err) {
      console.error('Failed to delete medical record:', err);
      return { 
        success: false, 
        message: err.message || 'Failed to delete medical record. Please try again.'
      };
    }
  };
  
  // Context value
  const value = {
    records,
    loading,
    error,
    getRecordById,
    createRecord,
    updateRecord,
    deleteRecord
  };
  
  return (
    <MedicalRecordsContext.Provider value={value}>
      {children}
    </MedicalRecordsContext.Provider>
  );
};

export const useMedicalRecords = () => {
  const context = useContext(MedicalRecordsContext);
  if (!context) {
    throw new Error('useMedicalRecords must be used within a MedicalRecordsProvider');
  }
  return context;
};