import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/AuthService';

/**
 * ProtectedRoute component that handles role-based access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {Array<string>} [props.allowedRoles] - Roles that are allowed to access this route
 * @param {boolean} [props.requireAuth=true] - Whether authentication is required
 * @returns {React.ReactNode} - The protected component or redirect
 */
const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state if auth is still being checked
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-lg">Verifying access permissions...</p>
    </div>
    );
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check if user has one of those roles
  if (allowedRoles.length > 0 && !allowedRoles.some(role => currentUser?.roles?.includes(role))) {
    console.error('Unauthorized role attempt:', currentUser?.roles);
    return <Navigate to="/" replace />;
  }

  // If user has passed all checks, render the protected component
  return children;
};

export default ProtectedRoute;