// src/utils/hipaaAudit.js
import { encryptData, decryptData } from './hipaaCompliance';

// Constants for audit log types
export const AUDIT_TYPES = {
  DOCUMENT_ACCESS: 'document_access',
  DOCUMENT_DOWNLOAD: 'document_download',
  DOCUMENT_UPLOAD: 'document_upload',
  DOCUMENT_DELETE: 'document_delete',
  DOCUMENT_MODIFY: 'document_modify',
  DOCUMENT_SHARE: 'document_share',
  CONSENT_ACCEPTANCE: 'consent_acceptance',
  CONSENT_REVOCATION: 'consent_revocation',
  POLICY_VIOLATION: 'policy_violation',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  BAA_CREATION: 'baa_creation',
  BAA_UPDATE: 'baa_update',
  BAA_TERMINATION: 'baa_termination',
  PATIENT_RECORD_ACCESS: 'patient_record_access',
  PATIENT_RECORD_MODIFY: 'patient_record_modify',
  EMERGENCY_ACCESS: 'emergency_access'
};

// Create detailed audit log entry
export const createAuditLog = async (type, details, user) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    userId: user.id,
    userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
    userRole: user.role,
    details: encryptData(details),
    sessionId: generateSessionId(),
    ipAddress: window.clientIp || 'unknown',
    ipValidated: validateIPAddress(window.clientIp),
    userAgent: navigator.userAgent,
    deviceInfo: getDeviceInfo(),
    accessLocation: window.accessLocation || 'unknown',
    accessMethod: details.accessMethod || 'standard',
    isEmergencyAccess: details.isEmergencyAccess || false,
    retentionPeriod: calculateRetentionPeriod(type),
    systemId: process.env.REACT_APP_SYSTEM_ID || 'healthcare-platform'
  };

  try {
    const response = await fetch('/api/hipaa/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(logEntry)
    });

    if (!response.ok) {
      throw new Error('Failed to create audit log');
    }

    return true;
  } catch (error) {
    console.error('Audit logging error:', error);
    return false;
  }
};

// Generate unique session ID for tracking user sessions
const generateSessionId = () => {
  // Use a more robust session ID generation method
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substr(2, 9);
  const browserFingerprint = navigator.userAgent.split('').reduce(
    (acc, char) => acc + char.charCodeAt(0), 0
  ).toString(16);
  
  return `session-${timestamp}-${randomPart}-${browserFingerprint}`;
};

// Validate IP address format
const validateIPAddress = (ip) => {
  if (!ip || ip === 'unknown') return false;
  
  // Basic IPv4 validation
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // Basic IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// Get device information for better audit tracking
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceInfo = {
    browser: 'unknown',
    os: 'unknown',
    mobile: false
  };
  
  // Detect browser
  if (userAgent.indexOf('Chrome') > -1) deviceInfo.browser = 'Chrome';
  else if (userAgent.indexOf('Safari') > -1) deviceInfo.browser = 'Safari';
  else if (userAgent.indexOf('Firefox') > -1) deviceInfo.browser = 'Firefox';
  else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) deviceInfo.browser = 'Internet Explorer';
  else if (userAgent.indexOf('Edge') > -1) deviceInfo.browser = 'Edge';
  
  // Detect OS
  if (userAgent.indexOf('Windows') > -1) deviceInfo.os = 'Windows';
  else if (userAgent.indexOf('Mac') > -1) deviceInfo.os = 'MacOS';
  else if (userAgent.indexOf('Linux') > -1) deviceInfo.os = 'Linux';
  else if (userAgent.indexOf('Android') > -1) deviceInfo.os = 'Android';
  else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) deviceInfo.os = 'iOS';
  
  // Detect if mobile
  deviceInfo.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  return deviceInfo;
};

// Calculate retention period based on log type
const calculateRetentionPeriod = (type) => {
  // HIPAA requires retaining records for 6 years
  const defaultRetention = 6 * 365 * 24 * 60 * 60 * 1000; // 6 years in milliseconds
  
  // Some records may need longer retention
  const retentionMap = {
    [AUDIT_TYPES.POLICY_VIOLATION]: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years for violations
    [AUDIT_TYPES.EMERGENCY_ACCESS]: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years for emergency access
    [AUDIT_TYPES.BAA_CREATION]: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years for BAA records
    [AUDIT_TYPES.BAA_TERMINATION]: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years for BAA records
  };
  
  const retentionPeriod = retentionMap[type] || defaultRetention;
  const expirationDate = new Date(Date.now() + retentionPeriod);
  
  return expirationDate.toISOString();
};

// Track document access attempts
export const trackDocumentAccess = async (documentId, action, user, additionalDetails = {}) => {
  const details = {
    documentId,
    action,
    timestamp: new Date().toISOString(),
    successful: true,
    documentType: additionalDetails.documentType || 'unknown',
    patientId: additionalDetails.patientId,
    accessReason: additionalDetails.accessReason || 'standard care',
    isEmergencyAccess: additionalDetails.isEmergencyAccess || false,
    accessMethod: additionalDetails.accessMethod || 'application',
    documentMetadata: additionalDetails.metadata || {},
    sensitivityLevel: additionalDetails.sensitivityLevel || 'standard',
    requiredPermission: additionalDetails.requiredPermission || 'view'
  };

  return await createAuditLog(AUDIT_TYPES.DOCUMENT_ACCESS, details, user);
};

// Log policy violations
export const logPolicyViolation = async (policy, violation, user) => {
  const details = {
    policy,
    violation,
    timestamp: new Date().toISOString(),
    severity: calculateViolationSeverity(violation)
  };

  return await createAuditLog(AUDIT_TYPES.POLICY_VIOLATION, details, user);
};

// Calculate violation severity based on type
const calculateViolationSeverity = (violation) => {
  const severityMap = {
    unauthorized_access: 'high',
    failed_encryption: 'high',
    missing_consent: 'medium',
    audit_failure: 'medium',
    invalid_request: 'low'
  };

  return severityMap[violation] || 'low';
};

// Retrieve audit logs for specific user or document
export const getAuditLogs = async (filters) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/hipaa/audit-logs?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }

    const logs = await response.json();
    return logs.map(log => ({
      ...log,
      details: decryptData(log.details)
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

// Validate document access permissions
export const validateDocumentAccess = (document, user) => {
  if (!user) return false;

  // Admin has full access
  if (user.role === 'admin') return true;

  // Check role-based permissions
  const rolePermissions = {
    doctor: ['view', 'download', 'upload'],
    nurse: ['view', 'download'],
    patient: ['view']
  };

  const userPermissions = rolePermissions[user.role] || [];
  
  // Check if user has required permission
  return userPermissions.includes(document.requiredPermission);
};