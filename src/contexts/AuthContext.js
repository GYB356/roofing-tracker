import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import auditLogService from '../services/auditLogService';

// Create the auth context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        
        // Check if token exists and is valid
        if (!authService.isAuthenticated()) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Get current user data from API
        const userData = await authService.getCurrentUser();
        
        if (!userData) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        setCurrentUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Authentication check failed:', err);
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUserId');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate role
      const validRoles = ['patient', 'provider', 'admin'];
      if (!validRoles.includes(userData.role)) {
        userData.role = 'patient'; // Default to patient if invalid role
      }
      
      // Call the register API endpoint
      const result = await authService.register(userData);
      
      // Log successful registration
      await auditLogService.logAuthentication('register', result.userId || 'new-user', true, {
        email: userData.email,
        role: userData.role
      });
      
      return { success: true, message: result.message || 'Registration successful. Please check your email to verify your account.' };
    } catch (err) {
      // Log failed registration
      await auditLogService.logAuthentication('register', 'unknown', false, {
        email: userData.email,
        error: err.message
      });
      
      setError(err.message || 'Registration failed. Please try again.');
      return { success: false, message: err.message || 'Registration failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the login API endpoint
      const result = await authService.login(email, password, rememberMe);
      
      // Set current user and authentication state
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      
      // Log successful authentication
      await auditLogService.logAuthentication('login', result.user.id, true, {
        email: email,
        rememberMe: rememberMe
      });
      
      // Redirect to the page the user was trying to access, or to the dashboard
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
      
      return { success: true };
    } catch (err) {
      // Log failed authentication attempt
      await auditLogService.logAuthentication('login', 'unknown', false, {
        email: email,
        error: err.message
      });
      
      setError(err.message || 'Login failed. Please check your credentials and try again.');
      return { 
        success: false, 
        message: err.message || 'Login failed. Please check your credentials and try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Log logout event before clearing user data
      const userId = localStorage.getItem('currentUserId');
      if (userId) {
        await auditLogService.logAuthentication('logout', userId, true);
      }
      
      // Call the logout API endpoint
      await authService.logout();
      
      // Clear user state
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const acceptHipaaConsent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the HIPAA consent API endpoint
      const result = await authService.acceptHipaaConsent();
      
      // Update current user with new HIPAA consent status
      if (result.success) {
        setCurrentUser({ 
          ...currentUser, 
          hipaaConsent: { 
            status: 'accepted', 
            date: new Date().toISOString() 
          } 
        });
        
        // Log HIPAA consent acceptance
        await auditLogService.createLog(
          auditLogService.LOG_TYPES.SYSTEM,
          'hipaa_consent_accepted',
          {
            userId: currentUser.id,
            timestamp: new Date().toISOString()
          }
        );
      }
      
      // Redirect to the page the user was trying to access, or to the dashboard
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
      
      return { success: true, message: 'HIPAA consent accepted.' };
    } catch (err) {
      setError(err.message || 'Failed to record HIPAA consent. Please try again.');
      return { 
        success: false, 
        message: err.message || 'Failed to record HIPAA consent. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Other auth functions (forgotPassword, resetPassword, verifyEmail) implemented similarly

  // Context value object with all the authentication state and functions
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    acceptHipaaConsent,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;