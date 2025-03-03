import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout components
import Layout from './components/Layout';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// Protected pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Billing from './pages/Billing';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Messaging from './pages/Messaging';
import StaffScheduling from './pages/StaffScheduling';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import HIPAADocs from './pages/HIPAADocs';
import DeviceIntegration from './pages/DeviceIntegration';
import Telemedicine from './pages/Telemedicine';

function App() {
    return (
    <Router>
      <AuthProvider>
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
            
          {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
          {/* Protected routes within Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Dashboard - accessible to all authenticated users */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Profile - accessible to all authenticated users */}
            <Route path="profile" element={<Profile />} />
            
            {/* Billing - accessible to patients, admin, and staff */}
            <Route path="billing" element={
              <ProtectedRoute requiredRole={['patient', 'admin', 'staff']}>
                <Billing />
              </ProtectedRoute>
            } />
            
            {/* Appointments - accessible to all authenticated users */}
            <Route path="appointments" element={<Appointments />} />
            
            {/* Medical Records - accessible to patients, doctors, nurses, and admin */}
            <Route path="medical-records" element={
              <ProtectedRoute requiredRole={['patient', 'doctor', 'nurse', 'admin']}>
                <MedicalRecords />
              </ProtectedRoute>
            } />
            
            {/* Messaging - accessible to all authenticated users */}
            <Route path="messaging" element={<Messaging />} />
            
            {/* Staff Scheduling - accessible to staff, doctors, nurses, and admin */}
            <Route path="staff-scheduling" element={
              <ProtectedRoute requiredRole={['staff', 'doctor', 'nurse', 'admin']}>
                                <StaffScheduling />
              </ProtectedRoute>
            } />
            
            {/* Analytics Dashboard - accessible to admin only */}
            <Route path="analytics" element={
              <ProtectedRoute requiredRole="admin">
                                <AnalyticsDashboard />
              </ProtectedRoute>
            } />
            
            {/* HIPAA Documents - accessible to admin and compliance officers */}
            <Route path="hipaa-docs" element={
              <ProtectedRoute requiredPermission={['view_all', 'admin_panel']}>
                                <HIPAADocs />
              </ProtectedRoute>
            } />
            
            {/* Device Integration - accessible to doctors, nurses, and admin */}
            <Route path="device-integration" element={
              <ProtectedRoute requiredRole={['doctor', 'nurse', 'admin']}>
                                <DeviceIntegration />
              </ProtectedRoute>
            } />
            
            {/* Telemedicine - accessible to all authenticated users */}
            <Route path="telemedicine" element={<Telemedicine />} />
          </Route>
          
          {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
        </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App; 