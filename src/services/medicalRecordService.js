import api from './api';

const medicalRecordService = {
  // Get records for a patient
  getRecords: async (patientId) => {
    try {
      const response = await api.get(`/records/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch medical records');
    }
  },

  // Create new medical record
  createRecord: async (recordData) => {
    try {
      const response = await api.post('/records', recordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Record creation failed');
    }
  },

  // Update medical record
  updateRecord: async (recordId, updateData) => {
    try {
      const response = await api.patch(`/records/${recordId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Record update failed');
    }
  },

  // Get record by ID
  getRecordById: async (recordId) => {
    try {
      const response = await api.get(`/records/details/${recordId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch record details');
    }
  },

  // Add document to record
  addDocument: async (recordId, file) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await api.post(`/records/${recordId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Document upload failed');
    }
  },

  // Add clinical note
  addClinicalNote: async (recordId, noteContent) => {
    try {
      const response = await api.post(`/records/${recordId}/notes`, {
        content: noteContent
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Note addition failed');
    }
  }
};

export default medicalRecordService;