import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Protected Route component
 * Checks if user is authenticated before rendering children
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  // Log authentication status for debugging
  console.log('ProtectedRoute checking auth:', { 
    isAuthenticated: !!currentUser, 
    loading, 
    path: location.pathname 
  });

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  // And store the current path for redirecting back after login
  if (!currentUser) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  console.log('User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;