// services/AuthService.js
import api from './api.js';
import jwt_decode from 'jwt-decode';
import axios from 'axios';
import { API_URL, USE_MOCK_API } from '../config.js';

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
      // Add mock API support for development
      if (USE_MOCK_API) {
        // Mock successful response
        console.log('MOCK API: Register user', userData);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockToken = 'mock_token_' + Date.now();
        const mockRefreshToken = 'mock_refresh_' + Date.now();
        const mockUser = {
          id: 'user_' + Date.now(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          permissions: userData.role === 'admin' 
            ? ['all']
            : userData.role === 'provider' 
              ? ['view_patients', 'edit_appointments']
              : ['view_own_records']
        };
        
        // Store tokens and user data
        storeTokens(mockToken, mockRefreshToken, mockUser.id);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        return { 
          success: true, 
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken
        };
      }
      
      // Real API call
      const response = await api.post('/auth/register', userData);
      const { token, refreshToken, user } = response.data;
      
      // Store tokens and user data
      storeTokens(token, refreshToken, user.id);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user, token, refreshToken };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Login user
  login: async (email, password, rememberMe = false, role = 'patient') => {
    try {
      // Add mock API support for development
      if (USE_MOCK_API) {
        // Mock successful response
        console.log('MOCK API: Login user', { email, rememberMe, role });
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, always succeed with mock data
        const mockToken = 'mock_token_' + Date.now();
        const mockRefreshToken = 'mock_refresh_' + Date.now();
        const mockUser = {
          id: 'user_' + Date.now(),
          firstName: 'Demo',
          lastName: 'User',
          email: email,
          role: role,
          permissions: role === 'admin' 
            ? ['all']
            : role === 'provider' 
              ? ['view_patients', 'edit_appointments']
              : ['view_own_records']
        };
        
        // Store tokens and user data
        storeTokens(mockToken, mockRefreshToken, mockUser.id);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        }
        
        // Create mock dashboard data
        const mockDashboardData = {
          upcomingAppointments: [
            {
              _id: 'appt1',
              appointmentType: 'Annual Checkup',
              doctorId: {
                fullName: 'Dr. Sarah Johnson'
              },
              scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
            },
            {
              _id: 'appt2',
              appointmentType: 'Vaccination',
              doctorId: {
                fullName: 'Dr. Michael Chen'
              },
              scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            }
          ],
          recentMedicalRecords: [
            {
              _id: 'record1',
              recordType: 'Blood Test Results',
              recordDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
              provider: {
                fullName: 'Dr. Sarah Johnson'
              }
            },
            {
              _id: 'record2',
              recordType: 'X-Ray Report',
              recordDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
              provider: {
                fullName: 'Dr. Robert Williams'
              }
            }
          ],
          pendingBills: [
            {
              _id: 'bill1',
              invoiceNumber: 'INV-2023-0042',
              amount: 125.00,
              dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days from now
            }
          ],
          unreadMessages: 3,
          healthMetrics: {
            bloodPressure: '120/80',
            heartRate: 72,
            bmi: 24.5
          }
        };

        // Store the mock dashboard data in localStorage for other components to access
        localStorage.setItem('mockDashboardData', JSON.stringify(mockDashboardData));
        
        return { 
          success: true, 
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken
        };
      }
      
      // Real API call
      const response = await api.post('/auth/login', { email, password, rememberMe, role });
      const { token, refreshToken, user } = response.data;
      
      // Store tokens and user ID
      storeTokens(token, refreshToken, user.id);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store email if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Add mock API support for development
      if (USE_MOCK_API) {
        console.log('MOCK API: Logout user');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Call logout endpoint to invalidate token on server
        await api.post('/auth/logout');
      }
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
      // Add mock API support for development
      if (USE_MOCK_API) {
        console.log('MOCK API: Get user profile');
        
        // Return already stored user
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
      }
      
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
      // Add mock API support for development
      if (USE_MOCK_API) {
        // In mock mode, we'll consider the token valid if it exists and isn't expired
        const token = localStorage.getItem('token');
        return !!token && !isTokenExpired(token);
      }
      
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
      // Add mock API support for development
      if (USE_MOCK_API) {
        console.log('MOCK API: Accept HIPAA consent');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true, message: 'HIPAA consent recorded' };
      }
      
      const response = await api.post('/auth/hipaa-consent');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to record HIPAA consent');
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      // Add mock API support for development
      if (USE_MOCK_API) {
        console.log('MOCK API: Verify email with token', token);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true, message: 'Email verified successfully' };
      }
      
      const response = await api.post(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      // Add mock API support for development
      if (USE_MOCK_API) {
        console.log('MOCK API: Request password reset for', email);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { 
          success: true, 
          message: 'Password reset instructions sent to your email' 
        };
      }
      
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to request password reset');
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      // Add mock API support for development
      if (USE_MOCK_API) {
        console.log('MOCK API: Reset password with token', token);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true, message: 'Password reset successfully' };
      }
      
      const response = await api.post(`/auth/reset-password/${token}`, { 
        password: newPassword 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  },

  // Refresh token - Direct implementation to avoid circular dependency
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }
      
      // Add mock API support for development
      if (USE_MOCK_API) {
        console.log('MOCK API: Refresh token');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate new mock token
        const newToken = 'mock_refreshed_token_' + Date.now();
        localStorage.setItem('token', newToken);
        
        return true;
      }
      
      // Use axios directly to avoid circular dependency with api.js
      const response = await axios.post(
        `${API_URL}/auth/refresh-token`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
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
  },

  // Test API connection - useful for debugging
  testConnection: async () => {
    try {
      if (USE_MOCK_API) {
        console.log('MOCK API: Connection test');
        return { success: true, message: 'Mock API connection successful' };
      }
      
      const response = await axios.get(`${API_URL}/health-check`, { 
        timeout: 5000 
      });
      return { 
        success: true, 
        status: response.status,
        message: 'API connection successful' 
      };
    } catch (error) {
      console.error('API connection test failed:', error);
      return { 
        success: false, 
        status: error.response?.status,
        message: error.message || 'API connection failed' 
      };
    }
  }
};

export default authService;