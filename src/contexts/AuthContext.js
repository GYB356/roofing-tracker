// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/AuthService';
import { USE_MOCK_API } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [apiStatus, setApiStatus] = useState({ available: false, checking: true });

  // Initialize auth state and check API connection
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check API connection first
        if (!USE_MOCK_API) {
          const connectionTest = await AuthService.testConnection();
          setApiStatus({ 
            available: connectionTest.success, 
            checking: false,
            message: connectionTest.message
          });
          
          if (!connectionTest.success) {
            console.warn('API connection test failed, please check your server or use mock mode');
          }
        } else {
          setApiStatus({ available: true, checking: false });
        }
        
        // Check if the user is already logged in
        if (AuthService.isAuthenticated()) {
          const user = AuthService.getCurrentUser();
          setCurrentUser(user);
          setUserRole(user?.role);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth context:', error);
        // Clear credentials if error occurs
        await logout();
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };
    
    initAuth();
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false, role = 'patient') => {
    try {
      const response = await AuthService.login(email, password, rememberMe, role);
      
      // Update state
      setCurrentUser(response.user);
      setUserRole(response.user.role);
      setIsAuthenticated(true);
      
      return response.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await AuthService.register(userData);
      
      // Update state after successful registration
      setCurrentUser(response.user);
      setUserRole(response.user.role);
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Update state
      setCurrentUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission) => {
    if (!currentUser || !currentUser.permissions) {
      return false;
    }
    return currentUser.permissions.includes(permission);
  }, [currentUser]);

  // Auth context value
  const value = {
    currentUser,
    isAuthenticated,
    userRole,
    loading,
    apiStatus,
    login,
    register,
    logout,
    hasPermission,
    authChecked
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;