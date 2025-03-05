import axios from 'axios';
import { toast } from 'react-toastify';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api/auth',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: process.env.REACT_APP_API_TIMEOUT || 10000
    });
  }

  // Login method
  async login(email, password) {
    try {
      const response = await this.api.post('/login', { email, password });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Registration method
  async register(userData) {
    try {
      const response = await this.api.post('/register', userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // User profile management methods
  async getUserProfile() {
    try {
      const response = await this.api.get('/profile');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateUserProfile(profileData) {
    try {
      const response = await this.api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Password management methods
  async forgotPassword(email) {
    try {
      const response = await this.api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await this.api.post('/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.api.post('/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Email verification
  async verifyEmail(token) {
    try {
      const response = await this.api.get(`/verify-email/${token}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // HIPAA consent management
  async submitHipaaConsent(consentData) {
    try {
      const response = await this.api.post('/hipaa-consent', consentData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Error handling method with detailed logging
  handleError(error) {
    const errorLog = {
      message: 'Authentication service error',
      timestamp: new Date().toISOString(),
      details: null
    };

    if (error.response) {
      // Server responded with an error status
      errorLog.details = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };

      // Specific error handling based on status
      switch (error.response.status) {
        case 400:
          errorLog.message = 'Invalid request parameters';
          break;
        case 401:
          errorLog.message = 'Authentication failed';
          break;
        case 403:
          errorLog.message = 'Access forbidden';
          break;
        case 404:
          errorLog.message = 'Resource not found';
          break;
        case 500:
          errorLog.message = 'Internal server error';
          break;
        default:
          errorLog.message = error.response.data.message || 'An unexpected error occurred';
      }

      // Display user-friendly toast notification
      toast.error(errorLog.message, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } else if (error.request) {
      // Request made but no response received
      errorLog.details = {
        request: error.request,
        message: 'No response received from server'
      };
      toast.error('Unable to connect to the server. Please check your internet connection.');
    } else {
      // Error in setting up the request
      errorLog.details = {
        message: 'Error processing request',
        error: error.message
      };
      toast.error('An unexpected error occurred. Please try again.');
    }

    // Log error details (replace with proper logging in production)
    console.error(JSON.stringify(errorLog, null, 2));

    // Throw a standardized error
    throw new Error(errorLog.message);
  }
}

export default new AuthService();