import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import ProviderDashboard from './ProviderDashboard';
import PatientDashboard from './PatientDashboard';

const Dashboard = () => {
  const { currentUser } = useAuth();

  // Add debugging to track user and role
  useEffect(() => {
    console.log('Dashboard - Current User:', currentUser);
    console.log('Dashboard - User Role:', currentUser?.role);
  }, [currentUser]);

  // Determine which dashboard to render based on user role
  const renderRoleBasedDashboard = () => {
    if (!currentUser) {
      console.log('No current user, defaulting to PatientDashboard');
      return <PatientDashboard />; // Default to patient dashboard if no user
    }

    console.log(`Rendering dashboard for role: ${currentUser.role}`);
    
    switch (currentUser.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'provider':
        return <ProviderDashboard />;
      case 'patient':
        return <PatientDashboard />;
      default:
        console.log(`Unknown role: ${currentUser.role}, defaulting to PatientDashboard`);
        return <PatientDashboard />; // Default to patient dashboard
    }
  };

  return renderRoleBasedDashboard();
};

export default Dashboard;