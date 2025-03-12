// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService.js';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if user is authenticated using AuthService
        const isAuthenticated = AuthService.isAuthenticated();
        
        if (!isAuthenticated) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Get current user from local storage or API
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setCurrentUser(null);
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      setError(null);
      
      // Use AuthService login
      const response = await AuthService.login(email, password, rememberMe);
      
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      setError(error.message || 'Failed to login. Please check your credentials.');
      throw error;
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      
      // Use AuthService register
      const response = await AuthService.register(userData);
      
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await AuthService.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setCurrentUser(null);
    }
  };
  
  // Update user profile (keeping for backward compatibility)
  const updateProfile = async (userData) => {
    try {
      setError(null);
      
      // This function would need to be added to AuthService
      // For now, just returning the userData
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...userData
      }));
      
      return userData;
    } catch (error) {
      setError(
        error.message || 
        'Failed to update profile. Please try again.'
      );
      throw error;
    }
  };
  
  // Reset password request
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      return await AuthService.requestPasswordReset(email);
    } catch (error) {
      setError(error.message || 'Failed to request password reset. Please try again.');
      throw error;
    }
  };
  
  // Reset password with token
  const resetPassword = async (token, password) => {
    try {
      setError(null);
      return await AuthService.resetPassword(token, password);
    } catch (error) {
      setError(
        error.message || 
        'Failed to reset password. Token may be invalid or expired.'
      );
      throw error;
    }
  };
  
  // Check if user has a specific role
  const hasRole = (role) => {
    return currentUser?.role === role;
  };
  
  const handleUserRole = (user) => {
    // Map role to specific dashboard route
    const roleRouteMap = {
      'admin': '/admin/dashboard',
      'provider': '/provider/dashboard',
      'patient': '/patient/dashboard'
    };
    
    // Set role-specific data in localStorage for easy access
    localStorage.setItem('userRole', user.role);
    
    return roleRouteMap[user.role] || '/';
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
    hasRole,
    handleUserRole
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;