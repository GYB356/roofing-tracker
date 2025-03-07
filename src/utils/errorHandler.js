// src/utils/errorHandler.js

/**
 * Global error handling utilities
 */

import { toast } from 'react-toastify';

/**
 * Format and display API errors as toast notifications
 * @param {Error} error - The error object from API call
 * @param {Object} options - Additional options for error handling
 */
export const handleApiError = (error, options = {}) => {
  const { 
    fallbackMessage = 'An unexpected error occurred. Please try again.',
    showToast = true,
    logToConsole = true,
    severity = 'error',
    position = 'top-right',
    autoClose = 5000
  } = options;
  
  // Determine the error message to display
  let errorMessage = fallbackMessage;
  let statusCode = null;
  
  // Extract useful information from different error types
  if (error.response) {
    // Server responded with error status
    statusCode = error.response.status;
    
    // Use specific error message from response if available
    if (error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.response.data && typeof error.response.data === 'string') {
      errorMessage = error.response.data;
    }
    
    // Handle specific status codes
    switch (statusCode) {
      case 401:
        errorMessage = 'Your session has expired. Please log in again.';
        // Could trigger logout or redirect to login here
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 422:
        errorMessage = error.response.data.message || 'Validation error. Please check your input.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        // Use the previously determined message
        break;
    }
  } else if (error.request) {
    // Request made but no response received (network issue)
    errorMessage = 'Network error. Please check your connection and try again.';
  } else if (error.message) {
    // Something else caused the error
    errorMessage = error.message;
  }
  
  // Show toast notification if enabled
  if (showToast) {
    switch (severity) {
      case 'error':
        toast.error(errorMessage, { position, autoClose });
        break;
      case 'warning':
        toast.warning(errorMessage, { position, autoClose });
        break;
      case 'info':
        toast.info(errorMessage, { position, autoClose });
        break;
      default:
        toast.error(errorMessage, { position, autoClose });
    }
  }
  
  // Log to console if enabled
  if (logToConsole) {
    console.error('API Error:', {
      message: errorMessage,
      statusCode,
      originalError: error
    });
  }
  
  // Return structured error info for further handling if needed
  return {
    message: errorMessage,
    statusCode,
    originalError: error
  };
};

/**
 * Setup global error handlers for uncaught exceptions
 */
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    // Show toast for unhandled rejections in production
    if (process.env.NODE_ENV === 'production') {
      toast.error('An unexpected error occurred. Our team has been notified.');
      
      // Here you would typically log to an error monitoring service
      // Example: Sentry.captureException(event.reason);
    }
  });
  
  // Override console.error to potentially capture and report errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Log the error normally
    originalConsoleError.apply(console, args);
    
    // In production, you might want to send these to your monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send first argument if it's an error object
      if (args[0] instanceof Error) {
        // Sentry.captureException(args[0]);
      }
    }
  };
  
  return () => {
    // Clean up function to remove event listeners if needed
    window.removeEventListener('unhandledrejection', this);
    console.error = originalConsoleError;
  };
};

/**
 * Format form validation errors for display
 * @param {Object} errors - Object containing validation errors
 * @returns {string} - Formatted error message
 */
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') {
    return 'Validation failed. Please check your input.';
  }
  
  const errorMessages = Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n');
  
  return errorMessages || 'Validation failed. Please check your input.';
};

/**
 * Handle HTTP errors and return appropriate user-friendly messages
 * @param {number} statusCode - HTTP status code
 * @returns {string} - User-friendly error message
 */
export const getHttpErrorMessage = (statusCode) => {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in again.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timeout. Please try again.';
    case 409:
      return 'Conflict with current state. Please refresh and try again.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};