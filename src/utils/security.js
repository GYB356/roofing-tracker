// src/utils/security.js
import CryptoJS from 'crypto-js';

// Secret key for client-side encryption (in a real app, this would be environment-specific)
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-fallback-key-for-dev-only';

/**
 * Encrypt sensitive data for local storage
 * @param {any} data - Data to encrypt
 * @returns {string} - Encrypted string
 */
export const encryptData = (data) => {
  if (!data) return null;
  
  const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
  return CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
};

/**
 * Decrypt data from local storage
 * @param {string} encryptedData - Encrypted string
 * @param {boolean} parseJson - Whether to parse result as JSON
 * @returns {any} - Decrypted data
 */
export const decryptData = (encryptedData, parseJson = true) => {
  if (!encryptedData) return null;
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) return null;
    
    return parseJson ? JSON.parse(decryptedString) : decryptedString;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Secure storage for sensitive data
 */
export const secureStorage = {
  setItem: (key, value) => {
    const encrypted = encryptData(value);
    localStorage.setItem(key, encrypted);
  },
  
  getItem: (key, parseJson = true) => {
    const encrypted = localStorage.getItem(key);
    return decryptData(encrypted, parseJson);
  },
  
  removeItem: (key) => {
    localStorage.removeItem(key);
  }
};

/**
 * Sanitize potentially sensitive data for logging
 * @param {object} data - Data to sanitize
 * @param {Array<string>} sensitiveFields - Fields to redact
 * @returns {object} - Sanitized data
 */
export const sanitizeForLogging = (data, sensitiveFields = ['password', 'token', 'ssn', 'dob']) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Log security events to a secure audit trail
 * @param {string} action - The action being performed
 * @param {object} details - Details about the action
 * @param {string} userId - ID of the user performing the action
 */
export const auditLog = (action, details, userId) => {
  const sanitizedDetails = sanitizeForLogging(details);
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details: sanitizedDetails,
    userAgent: navigator.userAgent,
    ipAddress: '127.0.0.1' // In a real app, this would come from the server
  };
  
  // In a mock implementation, store in localStorage
  const auditTrail = JSON.parse(localStorage.getItem('auditTrail') || '[]');
  auditTrail.push(logEntry);
  localStorage.setItem('auditTrail', JSON.stringify(auditTrail));
  
  // In a real implementation, this would send to a secure logging service
  console.log('AUDIT LOG:', logEntry);
};

/**
 * Generate secure session ID
 * @returns {string} - Secure random session ID
 */
export const generateSessionId = () => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

/**
 * Check if a user has permission for a specific action
 * @param {object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  // Role-based permissions mapping
  const rolePermissions = {
    admin: ['read_all', 'write_all', 'delete_all', 'manage_users', 'view_audit'],
    doctor: ['read_patients', 'write_medical', 'prescribe', 'schedule'],
    nurse: ['read_patients', 'update_vitals', 'schedule'],
    receptionist: ['schedule', 'read_basic'],
    patient: ['read_own', 'request_appointment', 'message_providers']
  };
  
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
};