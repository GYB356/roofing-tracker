import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import ProviderDashboard from './ProviderDashboard';
import PatientDashboard from './PatientDashboard';

const Dashboard = () => {
  const { currentUser } = useAuth();

  // Determine which dashboard to render based on user role
  const renderRoleBasedDashboard = () => {
    if (!currentUser) {
      return <PatientDashboard />; // Default to patient dashboard if no user
    }

    switch (currentUser.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'provider':
        return <ProviderDashboard />;
      case 'patient':
        return <PatientDashboard />;
      default:
        return <PatientDashboard />; // Default to patient dashboard
    }
  };

  return renderRoleBasedDashboard();
};

export default Dashboard;