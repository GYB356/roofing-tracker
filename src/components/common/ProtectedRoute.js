import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Protected route component that handles authentication and authorization
 * 
 * @param {Object} props - Component props
 * @param {JSX.Element} props.element - The element to render if authorized
 * @param {Array} props.allowedRoles - Optional array of roles allowed to access this route
 * @returns {JSX.Element} The authorized component or a redirect
 */
const ProtectedRoute = ({ element, allowedRoles, ...props }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAuthenticated && currentUser?.hipaaConsent?.status !== 'accepted') {
    return <Navigate to="/hipaa-consent" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    toast.error("You don't have permission to access this page");
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;