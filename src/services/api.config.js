import axios from 'axios';

const setupAxios = () => {
  // Set base URL for API requests
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Add request interceptor for authentication
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Add response interceptor for error handling
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Handle network errors
      if (!error.response) {
        console.error('Network Error:', error.message);
      }
      
      // Handle 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        // Don't redirect if already on login page or trying to login
        const isAuthEndpoint = error.config.url.includes('/auth/');
        const isLoginPage = window.location.pathname.includes('/login');
        
        if (!isAuthEndpoint && !isLoginPage) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export default setupAxios;

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';