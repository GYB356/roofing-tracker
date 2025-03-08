import axios from 'axios';

// Constants for API endpoints
const API_URL = process.env.REACT_APP_API_URL || 'https://api.roofingtracker.com/api';
const AUTH_ENDPOINT = `${API_URL}/auth`;

/**
 * Service for handling authentication operations that are common across user types
 */
class AuthService {
  constructor() {
    // Initialize interceptors for handling auth errors globally
    this.initializeInterceptors();
  }

  /**
   * Set up axios interceptors to handle authentication errors
   */
  initializeInterceptors() {
    // Response interceptor to handle token expiration and other auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // If we get a 401 Unauthorized response, the token might be expired
        if (error.response && error.response.status === 401) {
          // Log the error
          console.warn('Authentication error:', error.response.data);
          
          // Check if this is token expiration
          if (error.response.data.message?.includes('expired')) {
            this.handleTokenExpiration();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle expired token by logging out the user
   */
  handleTokenExpiration() {
    console.log('Token expired, redirecting to login');
    localStorage.removeItem('auth_token');
    
    // Store the current URL so we can redirect back after login
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      localStorage.setItem('auth_redirect', currentPath);
    }
    
    // Reload the page to force a redirect to login
    window.location.href = '/login?expired=true';
  }

  /**
   * Make a login request to the API
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (provider, admin, patient)
   * @returns {Promise} - Response from the API
   */
  async authenticateUser(email, password, role) {
    try {
      // Validate inputs
      if (!email || !password || !role) {
        return {
          success: false,
          error: 'Email, password, and role are required'
        };
      }
      
      console.log(`Authenticating ${role} with email: ${email}`);
      
      // Make API request
      const response = await axios.post(`${AUTH_ENDPOINT}/login`, {
        email,
        password,
        role: role.toLowerCase() // Convert to lowercase for API consistency
      });
      
      // Extract token and user data from response
      const { token, user } = response.data;
      
      if (!token) {
        console.error('No token received from the server');
        return {
          success: false,
          error: 'Authentication failed: No token received'
        };
      }
      
      // Set the token in local storage
      localStorage.setItem('auth_token', token);
      localStorage.setItem(`${role.toLowerCase()}_data`, JSON.stringify(user));
      
      // Set the authentication header
      this.setAuthHeader(token);
      
      // Check for a redirect URL
      const redirectUrl = localStorage.getItem('auth_redirect');
      if (redirectUrl) {
        localStorage.removeItem('auth_redirect');
      }
      
      return {
        success: true,
        user,
        redirectUrl
      };
    } catch (error) {
      // Handle various error scenarios
      if (!error.response) {
        console.error('Network error during authentication:', error.message);
        return {
          success: false,
          error: 'Network error. Please check your internet connection.'
        };
      }
      
      // API returned an error response
      const status = error.response.status;
      const errorData = error.response.data;
      
      console.error(`Authentication error (${status}):`, errorData);
      
      // Customize error messages based on status codes
      if (status === 401) {
        return {
          success: false,
          error: 'Invalid credentials. Please check your email and password.'
        };
      } else if (status === 403) {
        return {
          success: false,
          error: 'You do not have permission to access this system with the selected role.'
        };
      } else if (status === 404) {
        return {
          success: false,
          error: 'User not found. Please check your email or register for a new account.'
        };
      } else if (status === 429) {
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.'
        };
      } else {
        return {
          success: false,
          error: errorData.message || 'Authentication failed. Please try again.'
        };
      }
    }
  }

  /**
   * Set the authentication header for all subsequent requests
   * @param {string} token - JWT authentication token
   */
  setAuthHeader(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Get the authentication token
   * @returns {string|null} - The authentication token or null if not authenticated
   */
  getToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if a user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Log out the current user
   */
  logout() {
    // Remove all authentication data from storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('provider_data');
    localStorage.removeItem('admin_data');
    localStorage.removeItem('patient_data');
    
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // If there's a logout endpoint, you could call it here
    // await axios.post(`${AUTH_ENDPOINT}/logout`);
  }

  /**
   * Send a password reset request
   * @param {string} email - User's email address
   * @returns {Promise} - Response indicating success or failure
   */
  async requestPasswordReset(email) {
    try {
      const response = await axios.post(`${AUTH_ENDPOINT}/forgot-password`, { email });
      return {
        success: true,
        message: response.data.message || 'Password reset instructions sent to your email.'
      };
    } catch (error) {
      console.error('Password reset request failed:', error.response?.data?.message || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send password reset. Please try again.'
      };
    }
  }

  /**
   * Reset a password using a token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise} - Response indicating success or failure
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await axios.post(`${AUTH_ENDPOINT}/reset-password`, {
        token,
        password: newPassword
      });
      
      return {
        success: true,
        message: response.data.message || 'Password successfully reset.'
      };
    } catch (error) {
      console.error('Password reset failed:', error.response?.data?.message || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.'
      };
    }
  }
}

// Export a singleton instance of the service
const authService = new AuthService();
export default authService;