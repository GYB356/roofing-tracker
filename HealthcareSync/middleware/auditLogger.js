/**
 * Audit Logger Middleware
 * 
 * This middleware logs all actions in the system for compliance and security purposes.
 * It creates detailed audit logs for:
 * - Authentication events
 * - Data access
 * - Data modifications
 * - Administrative actions
 * - Security events
 */

const AuditLog = require('../models/AuditLog');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/audit.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Actions that require detailed logging
const sensitiveActions = {
  POST: true,
  PUT: true,
  PATCH: true,
  DELETE: true
};

// Determine action type based on HTTP method and path
const getActionType = (method, path) => {
  if (path.includes('/auth/login') || path.includes('/auth/logout')) {
    return 'AUTHENTICATION';
  }
  
  if (path.includes('/admin')) {
    return 'ADMINISTRATIVE';
  }
  
  switch (method) {
    case 'GET':
      return 'DATA_ACCESS';
    case 'POST':
      return 'DATA_CREATE';
    case 'PUT':
    case 'PATCH':
      return 'DATA_MODIFY';
    case 'DELETE':
      return 'DATA_DELETE';
    default:
      return 'OTHER';
  }
};

// Extract resource type from path
const getResourceType = (path) => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'api') {
    return parts[1].toUpperCase();
  }
  return 'UNKNOWN';
};

// Extract resource ID from path
const getResourceId = (path) => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 3 && parts[0] === 'api') {
    // Check if the third part is a valid ID (not a sub-resource)
    if (parts[2] && !parts[2].includes('?') && !isNaN(parts[2])) {
      return parts[2];
    }
  }
  return null;
};

// Sanitize request body to remove sensitive information
const sanitizeBody = (body) => {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'ssn', 'creditCard', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Audit logger middleware
exports.auditLogger = async (req, res, next) => {
  // Skip logging for static files and health checks
  if (req.path.startsWith('/static') || req.path === '/api/health') {
    return next();
  }
  
  // Store original end method
  const originalEnd = res.end;
  let responseBody = '';
  let responseStatus = 0;
  
  // Override end method to capture response
  res.end = function (chunk, encoding) {
    if (chunk) {
      responseBody = chunk.toString();
    }
    responseStatus = res.statusCode;
    originalEnd.call(this, chunk, encoding);
  };
  
  // Process the request
  const startTime = Date.now();
  
  // Continue with the request
  next();
  
  try {
    // After response is sent, log the audit entry
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Determine action type
    const actionType = getActionType(req.method, req.path);
    const resourceType = getResourceType(req.path);
    const resourceId = getResourceId(req.path) || req.params.id;
    
    // Only log detailed information for sensitive actions or authenticated users
    const shouldLogDetailed = sensitiveActions[req.method] || req.user;
    
    // Create audit log entry
    const auditEntry = {
      user: req.user ? req.user.id : null,
      action: actionType,
      resource: resourceType,
      resourceId: resourceId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
      duration: duration,
      status: responseStatus,
      details: shouldLogDetailed ? {
        method: req.method,
        path: req.path,
        query: req.query,
        body: sanitizeBody(req.body),
        responseStatus: responseStatus
      } : null
    };
    
    // Save to database asynchronously
    AuditLog.create(auditEntry)
      .catch(err => logger.error('Error saving audit log:', err));
    
    // Log to audit log file
    logger.info('Audit entry', {
      user: req.user ? req.user.id : 'anonymous',
      action: actionType,
      resource: resourceType,
      resourceId: resourceId,
      method: req.method,
      path: req.path,
      status: responseStatus,
      duration: duration
    });
  } catch (err) {
    logger.error('Audit logging error:', err);
  }
};

// Function to log specific actions programmatically
exports.logAuditEvent = async (userId, action, resource, resourceId, details) => {
  try {
    const auditEntry = {
      user: userId,
      action,
      resource,
      resourceId,
      ipAddress: 'internal',
      userAgent: 'system',
      timestamp: new Date(),
      details
    };
    
    // Save to database
    await AuditLog.create(auditEntry);
    
    // Log to audit log file
    logger.info('Manual audit entry', {
      user: userId,
      action,
      resource,
      resourceId
    });
    
    return true;
  } catch (err) {
    logger.error('Manual audit logging error:', err);
    return false;
  }
}; 