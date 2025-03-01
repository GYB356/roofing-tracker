/**
 * Error Handler Middleware
 * 
 * This middleware handles all errors in the application, providing:
 * - Consistent error responses
 * - Error logging
 * - Different error handling for development and production
 * - HIPAA-compliant error messages
 */

const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Mongoose validation error handler
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Mongoose duplicate key error handler
const handleDuplicateKeyError = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

// Mongoose cast error handler
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// JWT error handlers
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

// Sanitize error for production
const sanitizeError = (err) => {
  // Create a copy of the error with only safe properties
  return {
    status: err.status || 'error',
    statusCode: err.statusCode || 500,
    message: err.message || 'Something went wrong',
    isOperational: err.isOperational || false
  };
};

// Development error response
const sendErrorDev = (err, res) => {
  logger.error('Development Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode
  });
  
  res.status(err.statusCode || 500).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Log the error
  logger.error('Production Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    isOperational: err.isOperational
  });
  
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      status: err.status,
      message: err.message
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error for debugging
    console.error('ERROR 💥:', err);
    
    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Main error handler middleware
exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Handle specific error types
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Mongoose validation error
  if (err.name === 'ValidationError') error = handleValidationError(err);
  
  // Mongoose duplicate key error
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  
  // Mongoose cast error
  if (err.name === 'CastError') error = handleCastError(err);
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Send appropriate error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    // Sanitize error for production
    const sanitizedError = sanitizeError(error);
    sendErrorProd(sanitizedError, res);
  }
};

// 404 handler middleware
exports.notFoundHandler = (req, res, next) => {
  const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(err);
};

// Export the AppError class for use in other files
exports.AppError = AppError; 