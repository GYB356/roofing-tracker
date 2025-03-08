import api from './api';
import jwt_decode from 'jwt-decode';
// Remove the unused axios import
import axios from 'axios';

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt_decode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
};

// Helper function to securely store tokens
const storeTokens = (accessToken, refreshToken = null, userId = null) => {
  localStorage.setItem('token', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (userId) localStorage.setItem('currentUserId', userId);
};

// Helper function to remove tokens
const removeTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('user');
};

// Authentication service
const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Login user
  login: async (email, password, rememberMe = false, role = 'patient') => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe, role });
      const { token, refreshToken, user } = response.data;
      
      // Store tokens and user ID
      storeTokens(token, refreshToken, user.id);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always remove tokens from local storage
      removeTokens();
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token && !isTokenExpired(token);
  },
  
  // Get current user
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      // If there's an error parsing, clear the corrupted data
      localStorage.removeItem('user');
      return null;
    }
  },
  
  // Get user profile from API
  getUserProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data.isValid;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },
  
  // Accept HIPAA consent
  acceptHipaaConsent: async () => {
    try {
      const response = await api.post('/auth/hipaa-consent');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to record HIPAA consent');
    }
  },
  
  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.post(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  },
  
  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to request password reset');
    }
  },
  
  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password: newPassword });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  },
  
  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }
      
      // Use axios directly to avoid circular dependency with api.js
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || '/api'}/auth/refresh-token`,
        { refreshToken }
      );
      
      const { token: newToken } = response.data;
      
      // Store the new token
      localStorage.setItem('token', newToken);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      removeTokens();
      return false;
    }
  }
};

export default authService;
// Remove any code after this line that might include another default export