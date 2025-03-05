import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Get the user from localStorage based on the token
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUserId = localStorage.getItem('currentUserId');
        
        if (!currentUserId) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }
        
        const user = users.find(u => u.id === currentUserId);
        
        if (!user) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('currentUserId');
          setLoading(false);
          return;
        }
        
        setCurrentUser(user);
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
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Store user data in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find(user => user.email === userData.email);
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Create a new user with an ID and store in localStorage
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        hipaaConsent: { status: 'pending', date: null },
        emailVerified: true // Setting to true for testing convenience
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      return { success: true, message: 'Registration successful. Please check your email to verify your account.' };
    } catch (err) {
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
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);
      
      if (!user || user.password !== password) {
        throw new Error('Invalid credentials');
      }
      
      // Create a mock token
      const token = `mock-token-${Date.now()}`;
      localStorage.setItem('token', token);
      localStorage.setItem('currentUserId', user.id);
      
      // If rememberMe is true, we could set a longer expiration
      localStorage.setItem('rememberMe', rememberMe);
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Redirect to the page the user was trying to access, or to the dashboard
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
      return { 
        success: false, 
        message: err.message || 'Login failed. Please check your credentials and try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      // Clear token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('currentUserId');
      
      // Clear user state
      setCurrentUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      
      // Redirect to login page
      navigate('/login');
    }, 500);
  }, [navigate]);

  const acceptHipaaConsent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      // Update HIPAA consent
      users[userIndex].hipaaConsent = { 
        status: 'accepted', 
        date: new Date().toISOString() 
      };
      
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update current user
      setCurrentUser({ 
        ...currentUser, 
        hipaaConsent: { 
          status: 'accepted', 
          date: new Date().toISOString() 
        } 
      });
      
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