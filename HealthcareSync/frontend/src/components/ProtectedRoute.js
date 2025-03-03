import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component that restricts access to routes based on authentication and roles
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} [props.requiredRole] - Role(s) required to access this route
 * @param {string|string[]} [props.requiredPermission] - Permission(s) required to access this route
 * @param {string} [props.redirectPath='/login'] - Path to redirect to if unauthorized
 */
const ProtectedRoute = ({ 
    children, 
    requiredRole, 
    requiredPermission, 
    redirectPath = '/login' 
}) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // If still loading auth state, show nothing (or could show a loading spinner)
    if (loading) {
        return <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    // If not authenticated, redirect to login
    if (!user) {
        // Save the location they were trying to go to for later redirect
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    // Check role requirements if specified
    if (requiredRole) {
        const hasRequiredRole = Array.isArray(requiredRole)
            ? requiredRole.some(role => user.role === role)
            : user.role === requiredRole;

        if (!hasRequiredRole) {
            // Log unauthorized access attempt
            console.log(`HIPAA Log: Unauthorized role access attempt by ${user.id} (${user.role}) to ${location.pathname}`);
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // Check permission requirements if specified
    if (requiredPermission) {
        const permissions = user.permissions || [];
        const hasRequiredPermission = Array.isArray(requiredPermission)
            ? requiredPermission.some(perm => permissions.includes(perm))
            : permissions.includes(requiredPermission);

        if (!hasRequiredPermission) {
            // Log unauthorized access attempt
            console.log(`HIPAA Log: Unauthorized permission access attempt by ${user.id} (${user.role}) to ${location.pathname}`);
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // User is authenticated and authorized
    return children;
};

export default ProtectedRoute; 