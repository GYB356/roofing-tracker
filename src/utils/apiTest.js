// src/utils/apiTest.js
import api from '../services/api';

/**
 * Tests the connection to the API server
 * @returns {Promise<Object>} Result object with success status, message and data
 */
export const testApiConnection = async () => {
  try {
    const response = await api.get('/health-check');
    console.log('API Connection Test:', response.data);
    return {
      success: true,
      message: 'Connected to API successfully',
      data: response.data
    };
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to connect to API',
      error
    };
  }
};

/**
 * Tests authentication by attempting to access a protected endpoint
 * @param {string} token - JWT token for authentication
 * @returns {Promise<Object>} Result object with auth status
 */
export const testAuthConnection = async (token) => {
  try {
    const response = await api.get('/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Auth Connection Test:', response.data);
    return {
      success: true,
      message: 'Authentication verified successfully',
      data: response.data
    };
  } catch (error) {
    console.error('Auth Connection Test Failed:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Authentication verification failed',
      error
    };
  }
};

/**
 * Utility to check API version and compatibility
 * @returns {Promise<Object>} API version information
 */
export const checkApiVersion = async () => {
  try {
    const response = await api.get('/version');
    console.log('API Version:', response.data);
    return {
      success: true,
      version: response.data.version,
      compatible: response.data.compatible !== false,
      message: response.data.message || 'API version check successful'
    };
  } catch (error) {
    console.error('API Version Check Failed:', error);
    return {
      success: false,
      message: 'Failed to check API version',
      error
    };
  }
};

export default {
  testApiConnection,
  testAuthConnection,
  checkApiVersion
};