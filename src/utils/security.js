// utils/security.js
/**
 * Security utilities for handling sensitive data
 * Provides secure storage and permission checking functionality
 */

// A wrapper for localStorage that encrypts/decrypts data
export const secureStorage = {
  // Simple encryption function (in production, use a real encryption library)
  _encrypt: (data) => {
    try {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }
      return btoa(data);
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  },
  
  // Simple decryption function
  _decrypt: (encryptedData) => {
    try {
      const decoded = atob(encryptedData);
      try {
        // Try to parse as JSON
        return JSON.parse(decoded);
      } catch {
        // Return as is if not valid JSON
        return decoded;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  },
  
  // Store item with encryption
  setItem: async (key, value) => {
    try {
      const encryptedValue = secureStorage._encrypt(value);
      if (encryptedValue) {
        localStorage.setItem(key, encryptedValue);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error storing encrypted item:', error);
      return false;
    }
  },
  
  // Retrieve and decrypt item
  getItem: async (key) => {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;
      return secureStorage._decrypt(encryptedValue);
    } catch (error) {
      console.error('Error retrieving encrypted item:', error);
      return null;
    }
  },
  
  // Remove item
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      return false;
    }
  },
  
  // Clear all items
  clear: async () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};

/**
 * Encrypt data for secure transmission
 * @param {any} data - Data to encrypt
 * @returns {string} Encrypted data string
 */
export const encryptData = (data) => {
  return secureStorage._encrypt(data);
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - Current user object
 * @param {string} permission - Permission to check for
 * @returns {boolean} Whether user has the permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions.includes(permission);
};

export default {
  secureStorage,
  encryptData,
  hasPermission
};