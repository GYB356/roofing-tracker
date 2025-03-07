import api from './api';

/**
 * Provider service for handling all provider-related API calls
 */
const providerService = {
  /**
   * Get provider's schedule
   * @param {Object} params - Query parameters (date, startDate, endDate)
   * @returns {Promise} - Response with schedule data
   */
  getSchedule: async (params = {}) => {
    try {
      const response = await api.get('/providers/schedule', { params });
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Update provider's availability
   * @param {Object} availabilityData - Availability details
   * @returns {Promise} - Response with updated availability
   */
  updateAvailability: async (availabilityData) => {
    try {
      const response = await api.post('/providers/availability', availabilityData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Get provider's patients
   * @param {Object} params - Query parameters (query, status, pageSize, page)
   * @returns {Promise} - Response with patients data
   */
  getPatients: async (params = {}) => {
    try {
      const response = await api.get('/providers/patients', { params });
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Get a specific patient's details
   * @param {string} patientId - ID of the patient
   * @returns {Promise} - Response with patient details
   */
  getPatient: async (patientId) => {
    try {
      const response = await api.get(`/providers/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Get patient's medical records
   * @param {string} patientId - ID of the patient
   * @param {Object} params - Query parameters (type, date, pageSize, page)
   * @returns {Promise} - Response with medical records
   */
  getPatientMedicalRecords: async (patientId, params = {}) => {
    try {
      const response = await api.get(`/providers/patients/${patientId}/medical-records`, { params });
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Create a new medical record
   * @param {string} patientId - ID of the patient
   * @param {Object} recordData - Medical record details
   * @returns {Promise} - Response with created record
   */
  createMedicalRecord: async (patientId, recordData) => {
    try {
      const response = await api.post(`/providers/patients/${patientId}/medical-records`, recordData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Update an existing medical record
   * @param {string} recordId - ID of the medical record
   * @param {Object} recordData - Updated record details
   * @returns {Promise} - Response with updated record
   */
  updateMedicalRecord: async (recordId, recordData) => {
    try {
      const response = await api.put(`/providers/medical-records/${recordId}`, recordData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Create a new prescription
   * @param {string} patientId - ID of the patient
   * @param {Object} prescriptionData - Prescription details
   * @returns {Promise} - Response with created prescription
   */
  createPrescription: async (patientId, prescriptionData) => {
    try {
      const response = await api.post(`/providers/patients/${patientId}/prescriptions`, prescriptionData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Update an existing prescription
   * @param {string} prescriptionId - ID of the prescription
   * @param {Object} prescriptionData - Updated prescription details
   * @returns {Promise} - Response with updated prescription
   */
  updatePrescription: async (prescriptionId, prescriptionData) => {
    try {
      const response = await api.put(`/providers/prescriptions/${prescriptionId}`, prescriptionData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Handle prescription refill request
   * @param {string} refillRequestId - ID of the refill request
   * @param {Object} decisionData - Decision details (approved, denied, notes)
   * @returns {Promise} - Response with decision status
   */
  handleRefillRequest: async (refillRequestId, decisionData) => {
    try {
      const response = await api.post(`/providers/prescription-refills/${refillRequestId}/decision`, decisionData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Get lab results for a patient
   * @param {string} patientId - ID of the patient
   * @param {Object} params - Query parameters (type, date, pageSize, page)
   * @returns {Promise} - Response with lab results
   */
  getLabResults: async (patientId, params = {}) => {
    try {
      const response = await api.get(`/providers/patients/${patientId}/lab-results`, { params });
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Order a new lab test
   * @param {string} patientId - ID of the patient
   * @param {Object} labOrderData - Lab order details
   * @returns {Promise} - Response with created lab order
   */
  orderLabTest: async (patientId, labOrderData) => {
    try {
      const response = await api.post(`/providers/patients/${patientId}/lab-orders`, labOrderData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Get provider's messages
   * @param {Object} params - Query parameters (read, patient, pageSize, page)
   * @returns {Promise} - Response with messages
   */
  getMessages: async (params = {}) => {
    try {
      const response = await api.get('/providers/messages', { params });
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Send a new message
   * @param {Object} messageData - Message details
   * @returns {Promise} - Response with sent message
   */
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/providers/messages', messageData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Get telemedicine appointments
   * @param {Object} params - Query parameters (status, date, pageSize, page)
   * @returns {Promise} - Response with telemedicine appointments
   */
  getTelemedicineAppointments: async (params = {}) => {
    try {
      const response = await api.get('/providers/telemedicine', { params });
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * Start a telemedicine session
   * @param {string} appointmentId - ID of the appointment
   * @returns {Promise} - Response with session details
   */
  startTelemedicineSession: async (appointmentId) => {
    try {
      const response = await api.post(`/providers/telemedicine/${appointmentId}/start`);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  },

  /**
   * End a telemedicine session
   * @param {string} sessionId - ID of the session
   * @param {Object} sessionData - Session summary data
   * @returns {Promise} - Response with session summary
   */
  endTelemedicineSession: async (sessionId, sessionData) => {
    try {
      const response = await api.post(`/providers/telemedicine/${sessionId}/end`, sessionData);
      return response.data;
    } catch (error) {
      throw handleProviderError(error);
    }
  }
};

/**
 * Helper function to handle provider service errors
 * @param {Error} error - The error object
 * @returns {Error} - Processed error with helpful message
 */
const handleProviderError = (error) => {
  let errorMessage = 'An error occurred while processing your request.';
  
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        errorMessage = data.message || 'Invalid request. Please check your input.';
        break;
      case 401:
        errorMessage = 'Authentication required. Please log in again.';
        break;
      case 403:
        errorMessage = 'Access denied. You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 409:
        errorMessage = data.message || 'Conflict with the current state of the resource.';
        break;
      case 422:
        errorMessage = data.message || 'Validation failed. Please check your input.';
        break;
      default:
        errorMessage = data.message || 'Server error. Please try again later.';
    }
  } else if (error.request) {
    errorMessage = 'No response from server. Please check your internet connection.';
  }
  
  const customError = new Error(errorMessage);
  customError.originalError = error;
  return customError;
};

export default providerService;