import api from './api';

const medicalRecordsService = {
  // Get medical records for current patient
  getRecords: async (patientId) => {
    try {
      const response = await api.get(`/medical-records/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch medical records');
    }
  },

  // Create new medical record
  createRecord: async (recordData) => {
    try {
      const response = await api.post('/medical-records', recordData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create medical record');
    }
  },

  // Update existing medical record
  updateRecord: async (recordId, updates) => {
    try {
      const response = await api.put(`/medical-records/${recordId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update medical record');
    }
  },

  // Delete medical record
  deleteRecord: async (recordId) => {
    try {
      await api.delete(`/medical-records/${recordId}`);
      return true;
    } catch (error) {
      throw new Error('Failed to delete medical record');
    }
  }
};

export default medicalRecordsService;