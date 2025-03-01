/**
 * Authentication Middleware
 * 
 * This middleware handles JWT authentication and role-based access control.
 * It provides:
 * - JWT authentication
 * - Role-based access control
 * - Session management
 * - Token generation and verification
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/auth.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Middleware to authenticate JWT tokens
 * This middleware will check for a JWT token in the Authorization header or cookies
 * and attach the user to the request object if the token is valid.
 * It does not block the request if no token is provided or the token is invalid.
 */
exports.authenticateJWT = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    // If no token, continue without authentication
    if (!token) {
      return next();
    }
    
    try {
      // Verify token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next();
      }
      
      // Check if user changed password after token was issued
      if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
        return next();
      }
      
      // Attach user to request
      req.user = user;
      
      // Log successful authentication
      logger.info(`User ${user.id} authenticated via JWT`);
      
      next();
    } catch (err) {
      // Invalid token, continue without authentication
      logger.warn(`Invalid JWT: ${err.message}`);
      next();
    }
  } catch (err) {
    logger.error('JWT authentication error:', err);
    next(err);
  }
};

/**
 * Middleware to require authentication
 * This middleware will block the request if no user is attached to the request object.
 */
exports.requireAuth = (req, res, next) => {
  if (!req.user) {
    logger.warn(`Unauthorized access attempt to ${req.originalUrl}`);
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }
  
  next();
};

/**
 * Middleware to require specific roles
 * This middleware will block the request if the user does not have the required role.
 * @param {Array} roles - Array of allowed roles
 */
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn(`Unauthorized access attempt to ${req.originalUrl}`);
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`Forbidden access attempt by user ${req.user.id} with role ${req.user.role} to ${req.originalUrl}`);
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    
    next();
  };
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
exports.generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * Generate refresh token
 * @param {String} userId - User ID
 * @returns {String} Refresh token
 */
exports.generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
};

/**
 * Set JWT cookie
 * @param {Object} res - Response object
 * @param {String} token - JWT token
 */
exports.setCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || 86400000)), // 1 day default
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.cookie('jwt', token, cookieOptions);
};

/**
 * Clear JWT cookie
 * @param {Object} res - Response object
 */
exports.clearCookie = (res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true
  });
};

/**
 * Check if user has permission to access a resource
 * @param {Object} user - User object
 * @param {String} resourceOwnerId - Resource owner ID
 * @returns {Boolean} True if user has permission
 */
exports.hasPermission = (user, resourceOwnerId) => {
  // Admin has access to all resources
  if (user.role === 'admin') {
    return true;
  }
  
  // Doctors and nurses have access to their patients' resources
  if (['doctor', 'nurse'].includes(user.role)) {
    // This would need to be expanded with actual patient-provider relationship check
    return true;
  }
  
  // Users can access their own resources
  return user.id.toString() === resourceOwnerId.toString();
};

/**
 * Middleware to check if user has permission to access a resource
 * @param {Function} getResourceOwnerId - Function to get resource owner ID from request
 */
exports.checkPermission = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      
      if (!exports.hasPermission(req.user, resourceOwnerId)) {
        logger.warn(`Permission denied for user ${req.user.id} to access resource owned by ${resourceOwnerId}`);
        return next(new AppError('You do not have permission to access this resource.', 403));
      }
      
      next();
    } catch (err) {
      logger.error('Permission check error:', err);
      next(err);
    }
  };
}; 