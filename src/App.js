import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './components/dashboard/Dashboard';
import Sidebar from './components/layout/Sidebar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProviderDashboard from './components/dashboard/ProviderDashboard';
import VerifyEmailSent from './components/auth/VerifyEmailSent';

// Main page components
import AppointmentsPage from './components/appointments/AppointmentsPage';
import MedicalRecordsPage from './components/medical-records/medicalrecordspage';
import MessagesPage from './components/messages/MessagesPage';
import TelemedicinePage from './components/telemedicine/TelemedicinePage';
import BillingPage from './components/billing/BillingPage';
import HealthMetricsPage from './components/health-metrics/HealthmetricsPage';

// Appointments submenu components
import ScheduleNewPage from './components/appointments/ScheduleNewPage';
import CalendarViewPage from './components/appointments/CalendarViewPage';

// Medical Records submenu components
import HealthSummaryPage from './components/medical-records/HealthSummaryPage';
import MedicationsPage from './components/medical-records/MedicationsPage';
import LabResultsPage from './components/medical-records/LabResultsPage';
import ImagingPage from './components/medical-records/ImagingPage';

// Billing submenu components
import InvoicesPage from './components/billing/InvoicesPage';
import PaymentMethodsPage from './components/billing/PaymentMethodsPage';

// Style for the app container
const appContainerStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#111827'
};

// Style for the main content area
const contentStyle = {
  flex: 1,
  padding: '1rem',
  overflowY: 'auto'
};

// Simple NotFound component
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
    <div className="bg-red-500 rounded-full p-6 mb-6">
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
    <h1 className="text-6xl font-bold mb-4">404</h1>
    <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
    <p className="text-lg text-gray-400 mb-8 text-center">Sorry, we couldn't find the page you're looking for.</p>
    <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center transition-colors">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
      </svg>
      Go back home
    </a>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div style={appContainerStyle}>
                <Sidebar />
                <main style={contentStyle}>
                  <Routes>
                    {/* Main routes */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                
                    {/* Appointments routes */}
                    <Route path="/appointments" element={<AppointmentsPage />} />
                    <Route path="/appointments/new" element={<ScheduleNewPage />} />
                    <Route path="/appointments/calendar" element={<CalendarViewPage />} />
                    
                    {/* Medical Records routes - restricted to admin, doctor, nurse */}
                    <Route path="/medical-records" element={
                      <ProtectedRoute allowedRoles={['admin', 'provider']}>
                        <MedicalRecordsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/medical-records/health-summary" element={
                      <ProtectedRoute allowedRoles={['admin', 'provider']}>
                        <HealthSummaryPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/medical-records/medications" element={
                      <ProtectedRoute allowedRoles={['admin', 'provider']}>
                        <MedicationsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/medical-records/lab-results" element={
                      <ProtectedRoute allowedRoles={['admin', 'provider']}>
                        <LabResultsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/medical-records/imaging" element={
                      <ProtectedRoute allowedRoles={['admin', 'provider']}>
                        <ImagingPage />
                      </ProtectedRoute>
                    } />
                    
                    {/* Messages route */}
                    <Route path="/messages" element={<MessagesPage />} />
                    
                    {/* Telemedicine route */}
                    <Route path="/telemedicine" element={<TelemedicinePage />} />
                    
                    {/* Billing routes */}
                    <Route path="/billing" element={<BillingPage />} />
                    <Route path="/billing/invoices" element={<InvoicesPage />} />
                    <Route path="/billing/payment-methods" element={<PaymentMethodsPage />} />
                    
                    {/* Health Metrics route */}
                    <Route path="/health-metrics" element={<HealthMetricsPage />} />
                    
                    {/* Catch-all route for 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProviderDashboard />
            </ProtectedRoute>
          } />
          
          {/* Add other routes here */}
          
          {/* Default route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;