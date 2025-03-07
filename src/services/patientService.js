import api from './api';

/**
 * Patient service for handling all patient-related API calls
 */
const patientService = {
  /**
   * Get patient appointments
   * @param {Object} params - Query parameters (status, date, pageSize, page)
   * @returns {Promise} - Response with appointments data
   */
  getAppointments: async (params = {}) => {
    try {
      const response = await api.get('/patients/appointments', { params });
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Schedule a new appointment
   * @param {Object} appointmentData - Appointment details
   * @returns {Promise} - Response with created appointment
   */
  scheduleAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/patients/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Reschedule an existing appointment
   * @param {string} appointmentId - ID of the appointment
   * @param {Object} appointmentData - Updated appointment details
   * @returns {Promise} - Response with updated appointment
   */
  rescheduleAppointment: async (appointmentId, appointmentData) => {
    try {
      const response = await api.put(`/patients/appointments/${appointmentId}`, appointmentData);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Cancel an appointment
   * @param {string} appointmentId - ID of the appointment
   * @param {Object} cancelData - Cancellation details (reason, etc.)
   * @returns {Promise} - Response with cancellation status
   */
  cancelAppointment: async (appointmentId, cancelData = {}) => {
    try {
      const response = await api.post(`/patients/appointments/${appointmentId}/cancel`, cancelData);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Get patient medical records
   * @param {Object} params - Query parameters (type, date, pageSize, page)
   * @returns {Promise} - Response with medical records
   */
  getMedicalRecords: async (params = {}) => {
    try {
      const response = await api.get('/patients/medical-records', { params });
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Get a specific medical record
   * @param {string} recordId - ID of the medical record
   * @returns {Promise} - Response with medical record details
   */
  getMedicalRecord: async (recordId) => {
    try {
      const response = await api.get(`/patients/medical-records/${recordId}`);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Request access to a specific medical record
   * @param {string} recordId - ID of the medical record
   * @param {Object} requestData - Details about the request
   * @returns {Promise} - Response with request status
   */
  requestRecordAccess: async (recordId, requestData) => {
    try {
      const response = await api.post(`/patients/medical-records/${recordId}/request-access`, requestData);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Get patient prescriptions
   * @param {Object} params - Query parameters (status, date, pageSize, page)
   * @returns {Promise} - Response with prescriptions data
   */
  getPrescriptions: async (params = {}) => {
    try {
      const response = await api.get('/patients/prescriptions', { params });
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Request prescription refill
   * @param {string} prescriptionId - ID of the prescription
   * @param {Object} refillData - Refill request details
   * @returns {Promise} - Response with refill request status
   */
  requestRefill: async (prescriptionId, refillData = {}) => {
    try {
      const response = await api.post(`/patients/prescriptions/${prescriptionId}/refill`, refillData);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Get patient billing information
   * @param {Object} params - Query parameters (status, date, pageSize, page)
   * @returns {Promise} - Response with billing data
   */
  getBilling: async (params = {}) => {
    try {
      const response = await api.get('/patients/billing', { params });
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Get a specific invoice
   * @param {string} invoiceId - ID of the invoice
   * @returns {Promise} - Response with invoice details
   */
  getInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/patients/billing/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Process payment for an invoice
   * @param {string} invoiceId - ID of the invoice
   * @param {Object} paymentData - Payment details
   * @returns {Promise} - Response with payment status
   */
  processPayment: async (invoiceId, paymentData) => {
    try {
      const response = await api.post(`/patients/billing/invoices/${invoiceId}/pay`, paymentData);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },

  /**
   * Get patient messages
   * @param {Object} params - Query parameters (read, sender, pageSize, page)
   * @returns {Promise} - Response with messages
   */
  getMessages: async (params = {}) => {
    try {
      const response = await api.get('/patients/messages', { params });
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },
  
  /**
   * Send a new message
   * @param {Object} messageData - Message details
   * @returns {Promise} - Response with sent message
   */
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/patients/messages', messageData);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },
  
  /**
   * Get health metrics
   * @param {Object} params - Query parameters (type, date, pageSize, page)
   * @returns {Promise} - Response with health metrics data
   */
  getHealthMetrics: async (params = {}) => {
    try {
      const response = await api.get('/patients/health-metrics', { params });
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  },
  
  /**
   * Add new health metric
   * @param {Object} metricData - Health metric details
   * @returns {Promise} - Response with created health metric
   */
  addHealthMetric: async (metricData) => {
    try {
      const response = await api.post('/patients/health-metrics', metricData);
      return response.data;
    } catch (error) {
      throw handlePatientError(error);
    }
  }
};

/**
 * Helper function to handle patient service errors
 * @param {Error} error - The error object
 * @returns {Error} - Processed error with helpful message
 */
const handlePatientError = (error) => {
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

export default patientService;