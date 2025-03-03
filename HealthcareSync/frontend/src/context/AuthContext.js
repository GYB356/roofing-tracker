import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        checkAuthStatus();
    }, []);
    
    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            
            const response = await axios.get('/api/auth/verify', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUser(response.data.user);
        } catch (err) {
            console.error('Auth status check failed:', err);
            localStorage.removeItem('token');
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Login function
    const login = async (credentials) => {
        try {
            const response = await axios.post('/api/auth/login', credentials);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            setUser(user);
            setError(null);
            
            // Log HIPAA event
            await axios.post('/api/hipaa/log', {
                event: 'User Login',
                userId: user.id,
                userRole: user.role
            });
            
            return user;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        }
    };
    
    // Register function
    const register = async (userData) => {
        try {
            const response = await axios.post('/api/auth/register', userData);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            setUser(user);
            setError(null);
            
            // Log HIPAA event
            await axios.post('/api/hipaa/log', {
                event: 'User Registration',
                userId: user.id,
                userRole: user.role
            });
            
            return user;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            throw err;
        }
    };
    
    // Logout function
    const logout = async () => {
        try {
            if (user) {
                // Log HIPAA event before clearing user data
                await axios.post('/api/hipaa/log', {
                    event: 'User Logout',
                    userId: user.id,
                    userRole: user.role
                });
            }
            
            localStorage.removeItem('token');
            setUser(null);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };
    
    // Update user profile
    const updateProfile = async (profileData) => {
        try {
            const response = await axios.put('/api/auth/profile', profileData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            setUser(response.data.user);
            setError(null);
            
            // Log HIPAA event
            await axios.post('/api/hipaa/log', {
                event: 'Profile Update',
                userId: user.id,
                userRole: user.role
            });
            
            return response.data.user;
        } catch (err) {
            setError(err.response?.data?.message || 'Profile update failed');
            throw err;
        }
    };
    
    // Check if user has a specific role
    const hasRole = (roles) => {
        if (!user) return false;
        return roles.includes(user.role);
    };
    
    // Context value
    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        hasRole
    };
    
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext; 