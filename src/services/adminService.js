// src/services/adminService.js
import api from './api';

/**
 * Admin service for handling all admin-related API calls
 */
const adminService = {
  /**
   * Get all users with pagination and filtering
   * @param {Object} params - Query parameters (role, status, query, pageSize, page)
   * @returns {Promise} - Response with users data
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get a specific user's details
   * @param {string} userId - ID of the user
   * @returns {Promise} - Response with user details
   */
  getUser: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User details
   * @returns {Promise} - Response with created user
   */
  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Update an existing user
   * @param {string} userId - ID of the user
   * @param {Object} userData - Updated user details
   * @returns {Promise} - Response with updated user
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Deactivate a user
   * @param {string} userId - ID of the user
   * @returns {Promise} - Response with deactivation status
   */
  deactivateUser: async (userId) => {
    try {
      const response = await api.post(`/admin/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Reactivate a user
   * @param {string} userId - ID of the user
   * @returns {Promise} - Response with reactivation status
   */
  reactivateUser: async (userId) => {
    try {
      const response = await api.post(`/admin/users/${userId}/reactivate`);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Reset a user's password
   * @param {string} userId - ID of the user
   * @returns {Promise} - Response with reset status
   */
  resetUserPassword: async (userId) => {
    try {
      const response = await api.post(`/admin/users/${userId}/reset-password`);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get all providers
   * @param {Object} params - Query parameters (specialty, status, query, pageSize, page)
   * @returns {Promise} - Response with providers data
   */
  getProviders: async (params = {}) => {
    try {
      const response = await api.get('/admin/providers', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get system-wide appointments
   * @param {Object} params - Query parameters (status, date, provider, pageSize, page)
   * @returns {Promise} - Response with appointments data
   */
  getAppointments: async (params = {}) => {
    try {
      const response = await api.get('/admin/appointments', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get system logs
   * @param {Object} params - Query parameters (level, module, startDate, endDate, pageSize, page)
   * @returns {Promise} - Response with logs data
   */
  getLogs: async (params = {}) => {
    try {
      const response = await api.get('/admin/logs', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get system settings
   * @returns {Promise} - Response with system settings
   */
  getSettings: async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Update system settings
   * @param {Object} settingsData - Updated settings
   * @returns {Promise} - Response with updated settings
   */
  updateSettings: async (settingsData) => {
    try {
      const response = await api.put('/admin/settings', settingsData);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get HIPAA compliance status
   * @param {Object} params - Query parameters (status, userType, pageSize, page)
   * @returns {Promise} - Response with compliance data
   */
  getHipaaCompliance: async (params = {}) => {
    try {
      const response = await api.get('/admin/hipaa-compliance', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get BAA (Business Associate Agreement) data
   * @param {Object} params - Query parameters (status, pageSize, page)
   * @returns {Promise} - Response with BAA data
   */
  getBaaData: async (params = {}) => {
    try {
      const response = await api.get('/admin/baa', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Add new BAA
   * @param {Object} baaData - BAA details
   * @returns {Promise} - Response with created BAA
   */
  addBaa: async (baaData) => {
    try {
      const response = await api.post('/admin/baa', baaData);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Update BAA status
   * @param {string} baaId - ID of the BAA
   * @param {Object} statusData - Status update data
   * @returns {Promise} - Response with updated BAA
   */
  updateBaaStatus: async (baaId, statusData) => {
    try {
      const response = await api.put(`/admin/baa/${baaId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get system analytics data
   * @param {Object} params - Query parameters (metric, startDate, endDate, groupBy)
   * @returns {Promise} - Response with analytics data
   */
  getAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/admin/analytics', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get system notifications
   * @param {Object} params - Query parameters (type, read, pageSize, page)
   * @returns {Promise} - Response with notifications data
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/admin/notifications', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Create a new system-wide notification
   * @param {Object} notificationData - Notification details
   * @returns {Promise} - Response with created notification
   */
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/admin/notifications', notificationData);
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Run system health check
   * @returns {Promise} - Response with health check results
   */
  runHealthCheck: async () => {
    try {
      const response = await api.get('/admin/system-health');
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  },

  /**
   * Get audit trail data
   * @param {Object} params - Query parameters (user, action, resource, startDate, endDate, pageSize, page)
   * @returns {Promise} - Response with audit trail data
   */
  getAuditTrail: async (params = {}) => {
    try {
      const response = await api.get('/admin/audit-trail', { params });
      return response.data;
    } catch (error) {
      throw handleAdminError(error);
    }
  }
};

/**
 * Helper function to handle admin service errors
 * @param {Error} error - The error object
 * @returns {Error} - Processed error with helpful message
 */
const handleAdminError = (error) => {
  let errorMessage = 'An error occurred. Please try again.';
  
  if (error.response) {
    // Server responded with error
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
        errorMessage = 'Resource not found. Please check your request.';
        break;
      case 409:
        errorMessage = data.message || 'Conflict with current state. Please refresh and try again.';
        break;
      case 422:
        errorMessage = data.message || 'Validation failed. Please check your input.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      default:
        errorMessage = data.message || 'Server error. Please try again later.';
    }
  } else if (error.request) {
    // No response received
    errorMessage = 'No response from server. Please check your internet connection.';
  }
  
  const customError = new Error(errorMessage);
  customError.originalError = error;
  customError.statusCode = error.response?.status;
  
  return customError;
};

export default adminService;