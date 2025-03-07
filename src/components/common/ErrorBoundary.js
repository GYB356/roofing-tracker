// src/components/common/ErrorBoundary.js
import React, { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary component to catch JavaScript errors in child components
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Update state when an error occurs
   * @param {Error} error - The error that was thrown
   * @returns {Object} - New state with error details
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method to catch errors and get component stack trace
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Component stack information
   */
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Log error to monitoring service
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Component stack information
   */
  logErrorToService(error, errorInfo) {
    // In production, this would send to your error monitoring service
    // Examples: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.error('Error captured by ErrorBoundary:', error, errorInfo);
    } else {
      console.error('Error captured by ErrorBoundary:', error, errorInfo);
    }
  }

  /**
   * Reset the error state to allow recovery
   */
  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  /**
   * Render fallback UI when error occurs or children when no error
   */
  render() {
    const { children, fallback } = this.props;
    const { hasError, error, errorInfo } = this.state;

    // If a custom fallback is provided, use it
    if (hasError && fallback) {
      return React.cloneElement(fallback, { 
        error, 
        errorInfo,
        onReset: this.handleReset 
      });
    }

    // Default error UI if no fallback provided
    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
          <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg text-white">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
              <div className="mt-4 p-4 bg-gray-900 rounded-md text-left">
                <p className="text-red-400 mb-2">
                  {error ? error.toString() : 'An unexpected error occurred'}
                </p>
                {process.env.NODE_ENV !== 'production' && errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-400 cursor-pointer">
                      Component Stack Details
                    </summary>
                    <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-48 p-2">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
              <div className="mt-6">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center mx-auto"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render children if no error
    return children;
  }
}