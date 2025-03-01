import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Configure axios defaults
  axios.defaults.baseURL = API_URL;
  
  // Set auth token in axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  
  // Load user on initial mount or token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
        setError(null);
      } catch (err) {
        console.error('Error loading user:', err);
        // Clear invalid tokens
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
        }
        setError('Failed to authenticate user');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [token]);
  
  // Register new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/register', userData);
      
      // If registration requires email verification
      if (res.data.requireVerification) {
        return {
          success: true,
          message: 'Registration successful. Please verify your email.'
        };
      }
      
      // Otherwise set token and user directly
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', { email, password });
      
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
      return {
        success: false,
        message: err.response?.data?.message || 'Authentication failed'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
    navigate('/login');
  };
  
  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const res = await axios.put('/api/auth/profile', profileData);
      
      setUser(res.data.user);
      
      return { success: true, user: res.data.user };
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      return {
        success: false,
        message: err.response?.data?.message || 'Profile update failed'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      await axios.put('/api/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
      
      return { success: true, message: 'Password updated successfully' };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to change password'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Request password reset
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/forgot-password', { email });
      return { 
        success: true, 
        message: res.data.message || 'Password reset email sent'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to send reset email'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/reset-password', { 
        token, 
        newPassword 
      });
      return { 
        success: true, 
        message: res.data.message || 'Password has been reset'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to reset password'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Verify email with token
  const verifyEmail = async (token) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/verify-email', { token });
      
      // If verification includes automatic login
      if (res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
      }
      
      return { 
        success: true, 
        message: res.data.message || 'Email verified successfully'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to verify email'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has completed HIPAA consent
  const hasHipaaConsent = () => {
    return user?.hipaaConsent?.status === 'accepted';
  };
  
  // Submit HIPAA consent
  const submitHipaaConsent = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/hipaa-consent');
      
      // Update user with new consent status
      setUser({
        ...user,
        hipaaConsent: {
          status: 'accepted',
          date: new Date()
        }
      });
      
      return { 
        success: true, 
        message: res.data.message || 'HIPAA consent recorded'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to record HIPAA consent'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Value object to be provided by context
  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    hasHipaaConsent,
    submitHipaaConsent,
    isAuthenticated: !!user
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};