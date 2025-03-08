import axios from 'axios';

/**
 * Configure global axios settings and interceptors
 */
const setupAxios = () => {
  // Get API URL from environment variables or use default
  const API_URL = process.env.REACT_APP_API_URL || 'https://api.roofingtracker.com/api';
  
  // Set default base URL
  axios.defaults.baseURL = API_URL;
  
  // Default timeout (10 seconds)
  axios.defaults.timeout = 10000;
  
  // Set default headers
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.headers.common['Accept'] = 'application/json';
  
  // Get auth token from localStorage if it exists
  const token = localStorage.getItem('auth_token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // Add request interceptor for logging and adding headers
  axios.interceptors.request.use(
    config => {
      // For debugging in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
      }
      
      return config;
    },
    error => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );
  
  // Add response interceptor for error handling
  axios.interceptors.response.use(
    response => {
      // For debugging in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Response] ${response.status} from ${response.config.url}`);
      }
      
      return response;
    },
    error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`[API Error] ${error.response.status}: ${error.response.data.message || 'Unknown error'}`);
        
        // Handle specific status codes
        switch (error.response.status) {
          case 401: // Unauthorized
            // Token might be expired or invalid
            // The authentication service will handle this
            break;
            
          case 403: // Forbidden
            console.warn('Access denied to this resource');
            break;
            
          case 404: // Not Found
            console.warn('Resource not found');
            break;
            
          case 500: // Server Error
            console.error('Internal server error');
            break;
            
          default:
            break;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('[API Error] No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[API Error] Request setup error:', error.message);
      }
      
      return Promise.reject(error);
    }
  );
};

/**
 * Create a custom axios instance for specific API modules
 * @param {Object} options - Configuration options for the instance
 * @returns {Object} - Axios instance with custom configuration
 */
export const createApiClient = (options = {}) => {
  const client = axios.create({
    baseURL: options.baseURL || axios.defaults.baseURL,
    timeout: options.timeout || axios.defaults.timeout,
    headers: {
      ...axios.defaults.headers.common,
      ...(options.headers || {})
    }
  });
  
  // Add custom interceptors if needed
  if (options.requestInterceptor) {
    client.interceptors.request.use(
      options.requestInterceptor.onFulfilled,
      options.requestInterceptor.onRejected
    );
  }
  
  if (options.responseInterceptor) {
    client.interceptors.response.use(
      options.responseInterceptor.onFulfilled,
      options.responseInterceptor.onRejected
    );
  }
  
  return client;
};

// Export the setup function
export default setupAxios;