// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if token exists and is valid on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Check if token is expired
        const decodedToken = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token is expired, remove it
          localStorage.removeItem('auth_token');
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Token is valid, set up axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get current user profile
        const response = await axios.get('/api/auth/me');
        setCurrentUser(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      
      const response = await axios.post('/api/auth/login', { 
        email, 
        password 
      });
      
      const { token, user } = response.data;
      
      // Store token and set current user
      localStorage.setItem('auth_token', token);
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Failed to login. Please check your credentials.'
      );
      throw error;
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      
      const response = await axios.post('/api/auth/register', userData);
      
      const { token, user } = response.data;
      
      // Store token and set current user
      localStorage.setItem('auth_token', token);
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Registration failed. Please try again.'
      );
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove token and user data regardless of API response
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
    }
  };
  
  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      
      const response = await axios.put('/api/auth/profile', userData);
      
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...response.data
      }));
      
      return response.data;
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Failed to update profile. Please try again.'
      );
      throw error;
    }
  };
  
  // Reset password request
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      
      const response = await axios.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Failed to request password reset. Please try again.'
      );
      throw error;
    }
  };
  
  // Reset password with token
  const resetPassword = async (token, password) => {
    try {
      setError(null);
      
      const response = await axios.post('/api/auth/reset-password', { 
        token, 
        password 
      });
      
      return response.data;
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Failed to reset password. Token may be invalid or expired.'
      );
      throw error;
    }
  };
  
  // Check if user has a specific role
  const hasRole = (role) => {
    return currentUser?.role === role;
  };
  
  // Context value
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    hasRole
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;