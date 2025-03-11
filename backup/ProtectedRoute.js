import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
<<<<<<< HEAD
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
=======
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-lg">Verifying access permissions...</p>
    </div>
>>>>>>> 658fd3e6f15718e98f3720565b546e7fc583585f
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
<<<<<<< HEAD
  
  // Check for role-based access if roles are specified
  if (allowedRoles.length > 0) {
    const userRole = currentUser?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to dashboard if user doesn't have required role
      return <Navigate to="/" replace />;
    }
=======

  // If specific roles are required, check if user has one of those roles
  if (allowedRoles.length > 0 && !allowedRoles.some(role => currentUser?.roles?.includes(role))) {
    console.error('Unauthorized role attempt:', currentUser?.roles);
    return <Navigate to="/" replace />;
>>>>>>> 658fd3e6f15718e98f3720565b546e7fc583585f
  }
  
  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute;