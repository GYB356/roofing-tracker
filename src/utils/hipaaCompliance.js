// src/utils/hipaaCompliance.js
import CryptoJS from 'crypto-js';

// Enhanced encryption key management with key rotation support
const PRIMARY_ENCRYPTION_KEY = process.env.REACT_APP_PRIMARY_ENCRYPTION_KEY || 'default-key-for-development';
const SECONDARY_ENCRYPTION_KEY = process.env.REACT_APP_SECONDARY_ENCRYPTION_KEY;
const KEY_VERSION = process.env.REACT_APP_ENCRYPTION_KEY_VERSION || '1';

// Key derivation function to strengthen the encryption key
const deriveEncryptionKey = (baseKey) => {
  try {
    // Use PBKDF2 for key derivation with a salt
    const salt = process.env.REACT_APP_ENCRYPTION_SALT || 'hipaa-compliance-salt';
    return CryptoJS.PBKDF2(baseKey, salt, { keySize: 256/32, iterations: 1000 }).toString();
  } catch (error) {
    console.error('Key derivation error:', error);
    throw new Error('Failed to derive encryption key');
  }
};

// Get the appropriate encryption key based on version
const getEncryptionKey = (version) => {
  // If no version specified, use the current key version
  const keyVersion = version || KEY_VERSION;
  
  // Select key based on version
  if (keyVersion === '1' || !SECONDARY_ENCRYPTION_KEY) {
    return deriveEncryptionKey(PRIMARY_ENCRYPTION_KEY);
  } else {
    return deriveEncryptionKey(SECONDARY_ENCRYPTION_KEY);
  }
};

// Encrypt sensitive data
export const encryptData = (data) => {
  try {
    const encryptionKey = getEncryptionKey();
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
    // Store the key version with the encrypted data
    return `${KEY_VERSION}:${encryptedData}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt sensitive data
export const decryptData = (encryptedString) => {
  try {
    // Parse the version and encrypted data
    const [version, encryptedData] = encryptedString.includes(':') 
      ? encryptedString.split(':', 2) 
      : ['1', encryptedString]; // Default to version 1 for backward compatibility
    
    // Get the appropriate key for this version
    const decryptionKey = getEncryptionKey(version);
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, decryptionKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Check if user has required HIPAA access
export const checkHIPAAAccess = (user) => {
  if (!user) return false;
  
  const allowedRoles = ['admin', 'doctor', 'nurse'];
  
  if (allowedRoles.includes(user.role)) {
    if (['doctor', 'nurse'].includes(user.role)) {
      return user.hipaaConsent && user.hipaaConsent.status === 'accepted';
    }
    return true; // Admins have full access
  }
  return false;
};

// Log HIPAA-related actions for audit trail
export const logHIPAAAction = async (action, details, userId) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    userId,
    ipAddress: window.clientIp || 'unknown', // IP should be set by server
    userAgent: navigator.userAgent
  };

  try {
    // In a real application, this should be sent to a secure logging service
    const response = await fetch('/api/hipaa-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(logEntry)
    });

    if (!response.ok) {
      throw new Error('Failed to log HIPAA action');
    }

    return true;
  } catch (error) {
    console.error('HIPAA logging error:', error);
    // Don't throw error to prevent disrupting user operations
    // but do return false to indicate logging failure
    return false;
  }
};

// Validate HIPAA compliance requirements
export const validateHIPAACompliance = (data) => {
  const requirements = [
    {
      check: () => data.encryption === true,
      message: 'Data must be encrypted'
    },
    {
      check: () => data.accessControl === true,
      message: 'Access control must be implemented'
    },
    {
      check: () => data.auditLogging === true,
      message: 'Audit logging must be enabled'
    },
    {
      check: () => data.backupExists === true,
      message: 'Data backup must exist'
    },
    {
      check: () => data.transmissionSecure === true,
      message: 'Data transmission must be secure'
    }
  ];

  const failures = requirements
    .filter(req => !req.check())
    .map(req => req.message);

  return {
    isCompliant: failures.length === 0,
    violations: failures
  };
};

// Sanitize PHI data for logging (remove sensitive information)
export const sanitizeForLogging = (data) => {
  const sensitiveFields = [
    'ssn',
    'creditCard',
    'password',
    'dateOfBirth',
    'phoneNumber',
    'email'
  ];

  return Object.keys(data).reduce((acc, key) => {
    if (sensitiveFields.includes(key.toLowerCase())) {
      acc[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      acc[key] = sanitizeForLogging(data[key]);
    } else {
      acc[key] = data[key];
    }
    return acc;
  }, {});
};

// Generate HIPAA compliance report
export const generateHIPAAReport = async (startDate, endDate, options = {}) => {
  try {
    // Build query parameters with additional filtering options
    const queryParams = new URLSearchParams({
      start: startDate,
      end: endDate,
      ...options
    }).toString();
    
    const response = await fetch(`/api/hipaa-logs?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch HIPAA logs');
    }

    const logs = await response.json();
    
    // Process logs and generate comprehensive report
    const report = {
      period: {
        start: startDate,
        end: endDate,
        generatedAt: new Date().toISOString()
      },
      summary: {
        totalAccesses: logs.length,
        uniqueUsers: new Set(logs.map(log => log.userId)).size,
        accessTypes: logs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {}),
        accessByRole: logs.reduce((acc, log) => {
          acc[log.userRole] = (acc[log.userRole] || 0) + 1;
          return acc;
        }, {}),
        accessByLocation: logs.reduce((acc, log) => {
          acc[log.accessLocation || 'unknown'] = (acc[log.accessLocation || 'unknown'] || 0) + 1;
          return acc;
        }, {}),
        emergencyAccesses: logs.filter(log => log.isEmergencyAccess).length,
        deviceBreakdown: logs.reduce((acc, log) => {
          if (log.deviceInfo) {
            const deviceType = log.deviceInfo.mobile ? 'mobile' : 'desktop';
            acc[deviceType] = (acc[deviceType] || 0) + 1;
          }
          return acc;
        }, {})
      },
      compliance: {
        violations: logs.filter(log => log.status === 'violation'),
        violationsByType: logs.filter(log => log.status === 'violation')
          .reduce((acc, log) => {
            acc[log.type] = (acc[log.type] || 0) + 1;
            return acc;
          }, {}),
        hipaaRequirements: {
          accessControls: calculateComplianceScore(logs, 'accessControl'),
          auditControls: calculateComplianceScore(logs, 'auditLogging'),
          integrityControls: calculateComplianceScore(logs, 'dataIntegrity'),
          transmissionSecurity: calculateComplianceScore(logs, 'transmissionSecurity')
        },
        riskScore: calculateRiskScore(logs)
      },
      recommendations: [],
      detailedLogs: options.includeDetailedLogs ? logs.map(log => sanitizeForLogging(log)) : undefined
    };

    // Generate intelligent recommendations based on logs
    if (report.compliance.violations.length > 0) {
      report.recommendations.push('Review access control policies and implement additional safeguards');
    }
    
    if (report.summary.emergencyAccesses > 0) {
      report.recommendations.push('Audit emergency access patterns and verify all emergency access was legitimate');
    }
    
    if (report.summary.totalAccesses > 1000) {
      report.recommendations.push('Consider implementing rate limiting and additional monitoring');
    }
    
    // Check for suspicious access patterns
    const suspiciousPatterns = detectSuspiciousPatterns(logs);
    if (suspiciousPatterns.length > 0) {
      report.recommendations.push('Investigate potentially suspicious access patterns');
      report.suspiciousPatterns = suspiciousPatterns;
    }

    return report;
  } catch (error) {
    console.error('Error generating HIPAA report:', error);
    throw new Error('Failed to generate HIPAA compliance report');
  }
};

// Calculate compliance score for a specific control area
const calculateComplianceScore = (logs, controlType) => {
  // This is a simplified implementation - in a real system this would use more sophisticated metrics
  const violations = logs.filter(log => 
    log.status === 'violation' && 
    log.details && 
    log.details.controlType === controlType
  ).length;
  
  const total = logs.filter(log => 
    log.details && 
    log.details.controlType === controlType
  ).length || 1; // Avoid division by zero
  
  const score = Math.max(0, 100 - (violations / total * 100));
  
  return {
    score: Math.round(score),
    violations,
    total,
    status: score > 95 ? 'excellent' : score > 85 ? 'good' : score > 70 ? 'fair' : 'poor'
  };
};

// Calculate overall risk score based on log patterns
const calculateRiskScore = (logs) => {
  let riskScore = 0;
  
  // Count high severity violations
  const highSeverityViolations = logs.filter(log => 
    log.status === 'violation' && 
    log.details && 
    log.details.severity === 'high'
  ).length;
  
  // Count emergency accesses
  const emergencyAccesses = logs.filter(log => log.isEmergencyAccess).length;
  
  // Count failed login attempts
  const failedLogins = logs.filter(log => log.type === 'LOGIN_FAILURE').length;
  
  // Add to risk score based on these factors
  riskScore += highSeverityViolations * 10;
  riskScore += emergencyAccesses * 5;
  riskScore += failedLogins * 2;
  
  // Normalize to 0-100 scale
  riskScore = Math.min(100, riskScore);
  
  return {
    score: riskScore,
    level: riskScore < 20 ? 'low' : riskScore < 50 ? 'medium' : riskScore < 80 ? 'high' : 'critical',
    factors: {
      highSeverityViolations,
      emergencyAccesses,
      failedLogins
    }
  };
};

// Detect suspicious access patterns in logs
const detectSuspiciousPatterns = (logs) => {
  const suspiciousPatterns = [];
  
  // Group logs by user
  const userLogs = {};
  logs.forEach(log => {
    if (!userLogs[log.userId]) {
      userLogs[log.userId] = [];
    }
    userLogs[log.userId].push(log);
  });
  
  // Check for unusual access times
  Object.entries(userLogs).forEach(([userId, userLogEntries]) => {
    // Check for off-hours access (simplified example)
    const offHoursAccess = userLogEntries.filter(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour < 6 || hour > 22; // Consider 10pm-6am as off-hours
    });
    
    if (offHoursAccess.length > 3) {
      suspiciousPatterns.push({
        type: 'off_hours_access',
        userId,
        count: offHoursAccess.length,
        details: 'Multiple accesses during off-hours'
      });
    }
    
    // Check for rapid access to many different patient records
    const patientAccesses = userLogEntries.filter(log => 
      log.type === 'PATIENT_RECORD_ACCESS' && 
      log.details && 
      log.details.patientId
    );
    
    const uniquePatients = new Set(patientAccesses.map(log => log.details.patientId)).size;
    const timeSpan = patientAccesses.length > 0 ? 
      (new Date(patientAccesses[patientAccesses.length-1].timestamp) - 
       new Date(patientAccesses[0].timestamp)) / (1000 * 60) : 0; // in minutes
    
    if (uniquePatients > 20 && timeSpan < 60) { // More than 20 patients in less than an hour
      suspiciousPatterns.push({
        type: 'rapid_patient_access',
        userId,
        count: uniquePatients,
        timeSpan: `${Math.round(timeSpan)} minutes`,
        details: 'Unusually rapid access to multiple patient records'
      });
    }
  });
  
  return suspiciousPatterns;
};