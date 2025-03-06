import api from './api';
import securityService from './securityService';

// Audit log service for HIPAA compliance
const auditLogService = {
  // Log types for different actions
  LOG_TYPES: {
    DATA_ACCESS: 'data_access',
    DATA_MODIFICATION: 'data_modification',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    SYSTEM: 'system'
  },
  
  // Log severity levels
  SEVERITY: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
  },
  
  // Create an audit log entry
  createLog: async (type, action, details, severity = 'info') => {
    try {
      // Get current user ID if available
      const userId = localStorage.getItem('currentUserId') || 'anonymous';
      
      // Create log entry
      const logEntry = {
        userId,
        type,
        action,
        details: securityService.sanitizeData(details), // Sanitize data to prevent XSS
        severity,
        timestamp: new Date().toISOString(),
        ipAddress: window.sessionStorage.getItem('userIp') || 'unknown',
        userAgent: navigator.userAgent
      };
      
      // Send log to server
      await api.post('/audit-logs', logEntry);
      
      // Also log to console in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log('Audit Log:', logEntry);
      }
      
      return { success: true };
    } catch (error) {
      // Log locally if server logging fails
      console.error('Failed to create audit log:', error);
      
      // Store failed logs locally for retry
      const failedLogs = JSON.parse(localStorage.getItem('failedAuditLogs') || '[]');
      failedLogs.push({
        userId: localStorage.getItem('currentUserId') || 'anonymous',
        type,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        severity,
        timestamp: new Date().toISOString(),
        error: error.message
      });
      localStorage.setItem('failedAuditLogs', JSON.stringify(failedLogs));
      
      return { success: false, error: error.message };
    }
  },
  
  // Log data access (for PHI)
  logDataAccess: async (dataType, recordId, action, additionalDetails = {}) => {
    return auditLogService.createLog(
      auditLogService.LOG_TYPES.DATA_ACCESS,
      action,
      {
        dataType,
        recordId,
        ...additionalDetails
      }
    );
  },
  
  // Log authentication events
  logAuthentication: async (action, userId, success, additionalDetails = {}) => {
    return auditLogService.createLog(
      auditLogService.LOG_TYPES.AUTHENTICATION,
      action,
      {
        userId,
        success,
        ...additionalDetails
      },
      success ? auditLogService.SEVERITY.INFO : auditLogService.SEVERITY.WARNING
    );
  },
  
  // Log authorization events (access control)
  logAuthorization: async (action, resource, success, additionalDetails = {}) => {
    return auditLogService.createLog(
      auditLogService.LOG_TYPES.AUTHORIZATION,
      action,
      {
        resource,
        success,
        ...additionalDetails
      },
      success ? auditLogService.SEVERITY.INFO : auditLogService.SEVERITY.WARNING
    );
  },
  
  // Retry sending failed logs
  retryFailedLogs: async () => {
    try {
      const failedLogs = JSON.parse(localStorage.getItem('failedAuditLogs') || '[]');
      
      if (failedLogs.length === 0) {
        return { success: true, message: 'No failed logs to retry' };
      }
      
      // Send failed logs in batch
      await api.post('/audit-logs/batch', { logs: failedLogs });
      
      // Clear failed logs on success
      localStorage.removeItem('failedAuditLogs');
      
      return { success: true, message: `Successfully sent ${failedLogs.length} failed logs` };
    } catch (error) {
      console.error('Failed to retry sending audit logs:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get audit logs for a specific user or record (admin function)
  getAuditLogs: async (filters = {}) => {
    try {
      const response = await api.get('/audit-logs', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch audit logs');
    }
  }
};

export default auditLogService;