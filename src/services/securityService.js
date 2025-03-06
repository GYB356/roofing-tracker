import CryptoJS from 'crypto-js';

// Security service for handling sensitive healthcare data
const securityService = {
  // Encryption key - in production, this should be stored securely and not in the code
  // For a real application, consider using a key management service
  getEncryptionKey: () => {
    // In production, this would come from environment variables or a secure vault
    return process.env.REACT_APP_ENCRYPTION_KEY || 'default-encryption-key-for-development-only';
  },
  
  // Encrypt sensitive data
  encryptData: (data) => {
    if (!data) return null;
    
    try {
      const key = securityService.getEncryptionKey();
      return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  },
  
  // Decrypt sensitive data
  decryptData: (encryptedData) => {
    if (!encryptedData) return null;
    
    try {
      const key = securityService.getEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  },
  
  // Hash sensitive data (one-way)
  hashData: (data) => {
    if (!data) return null;
    
    try {
      return CryptoJS.SHA256(data).toString();
    } catch (error) {
      console.error('Hashing error:', error);
      throw new Error('Failed to hash data');
    }
  },
  
  // Sanitize data to remove any potential XSS or injection attacks
  sanitizeData: (data) => {
    if (!data) return null;
    
    // If data is a string, sanitize it
    if (typeof data === 'string') {
      // Basic XSS protection
      return data
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    // If data is an object, recursively sanitize all string properties
    if (typeof data === 'object' && data !== null) {
      const sanitizedData = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          sanitizedData[key] = securityService.sanitizeData(data[key]);
        }
      }
      
      return sanitizedData;
    }
    
    // For other data types, return as is
    return data;
  },
  
  // Mask sensitive data for display (e.g., SSN, credit card)
  maskSensitiveData: (data, type) => {
    if (!data) return null;
    
    switch (type) {
      case 'ssn':
        // Format: XXX-XX-1234
        return data.replace(/^\d{5}/, 'XXX-XX');
      case 'creditCard':
        // Format: XXXX-XXXX-XXXX-1234
        return data.replace(/^\d{12}/, 'XXXX-XXXX-XXXX');
      case 'phone':
        // Format: (XXX) XXX-1234
        return data.replace(/^\d{6}/, '(XXX) XXX');
      case 'email':
        // Format: j***e@example.com
        const [username, domain] = data.split('@');
        if (username.length <= 2) return data;
        return `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}@${domain}`;
      default:
        return data;
    }
  },
  
  // Generate a secure random token
  generateSecureToken: (length = 32) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(randomValues[i] % characters.length);
    }
    
    return result;
  }
};

export default securityService;