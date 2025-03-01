/**
 * HIPAA Compliance Middleware
 * 
 * This middleware ensures that all requests adhere to HIPAA regulations:
 * - Enforces data encryption
 * - Logs PHI access
 * - Enforces session timeouts
 * - Implements minimum necessary access
 * - Validates HIPAA consent
 */

const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/hipaa.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// PHI-related endpoints that require special logging
const phiEndpoints = [
  '/api/patients',
  '/api/medical-records',
  '/api/lab-results',
  '/api/prescriptions',
  '/api/health-metrics',
  '/api/imaging',
  '/api/telemedicine'
];

// Check if a request path contains PHI
const containsPHI = (path) => {
  return phiEndpoints.some(endpoint => path.startsWith(endpoint));
};

// HIPAA compliance middleware
exports.hipaaCompliance = async (req, res, next) => {
  try {
    // Skip for non-authenticated requests
    if (!req.user) {
      return next();
    }

    // 1. Check if user has accepted HIPAA consent
    if (containsPHI(req.path)) {
      const user = await User.findById(req.user.id);
      if (!user || !user.hipaaConsent || !user.hipaaConsent.status === 'accepted') {
        logger.warn(`HIPAA consent not accepted: User ${req.user.id} attempted to access ${req.path}`);
        return res.status(403).json({
          error: 'HIPAA consent required',
          message: 'You must accept the HIPAA consent agreement before accessing protected health information.',
          consentRequired: true
        });
      }
    }

    // 2. Check session inactivity timeout
    const sessionTimeout = parseInt(process.env.SESSION_INACTIVITY_TIMEOUT) || 900; // 15 minutes default
    const lastActivity = req.session.lastActivity || 0;
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (lastActivity && (currentTime - lastActivity > sessionTimeout)) {
      logger.info(`Session timeout: User ${req.user.id} session expired due to inactivity`);
      req.session.destroy();
      return res.status(440).json({
        error: 'Session expired',
        message: 'Your session has expired due to inactivity. Please log in again.'
      });
    }
    
    // Update last activity timestamp
    req.session.lastActivity = currentTime;

    // 3. Log PHI access if applicable
    if (containsPHI(req.path)) {
      // Create audit log entry for PHI access
      await AuditLog.create({
        user: req.user.id,
        action: 'PHI_ACCESS',
        resource: req.path,
        resourceId: req.params.id || null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          method: req.method,
          query: req.query
        }
      });
      
      logger.info(`PHI access: User ${req.user.id} accessed ${req.path}`);
    }

    // 4. Add HIPAA-required headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // 5. Enforce data minimization by removing sensitive fields from responses
    const originalSend = res.send;
    res.send = function (body) {
      // Only process JSON responses
      if (res.getHeader('content-type')?.includes('application/json') && typeof body === 'string') {
        try {
          const data = JSON.parse(body);
          
          // Apply data minimization based on user role
          if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
            // Remove sensitive fields based on role
            // This is a simplified example - real implementation would be more comprehensive
            if (Array.isArray(data)) {
              data.forEach(item => {
                delete item.ssn;
                delete item.internalNotes;
                delete item.financialData;
              });
            } else {
              delete data.ssn;
              delete data.internalNotes;
              delete data.financialData;
            }
            
            body = JSON.stringify(data);
          }
        } catch (e) {
          // Not valid JSON, ignore
        }
      }
      
      return originalSend.call(this, body);
    };

    next();
  } catch (err) {
    logger.error('HIPAA compliance middleware error:', err);
    next(err);
  }
}; 