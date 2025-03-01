import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layout components
import Layout from './components/layout/Layout';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';

// Authentication components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyEmail from './components/auth/VerifyEmail';

// Patient components
import PatientDashboard from './components/patient/Dashboard';
import PatientProfile from './components/patient/Profile';
import MedicalRecords from './components/patient/MedicalRecords';
import HealthMetrics from './components/patient/HealthMetrics';
import DeviceIntegration from './components/patient/DeviceIntegration';

// Appointment components
import AppointmentCalendar from './components/appointments/Calendar';
import AppointmentForm from './components/appointments/AppointmentForm';
import AppointmentDetails from './components/appointments/AppointmentDetails';
import AppointmentHistory from './components/appointments/AppointmentHistory';
import AppointmentReminders from './components/appointments/Reminders';

// Prescription components
import PrescriptionList from './components/prescriptions/PrescriptionList';
import PrescriptionDetails from './components/prescriptions/PrescriptionDetails';
import RequestRefill from './components/prescriptions/RequestRefill';

// Lab Results components
import LabResultsList from './components/labResults/LabResultsList';
import LabResultsDetails from './components/labResults/LabResultsDetails';
import LabResultsUpload from './components/labResults/LabResultsUpload';

// Billing components
import BillingDashboard from './components/billing/Dashboard';
import PaymentHistory from './components/billing/PaymentHistory';
import MakePayment from './components/billing/MakePayment';
import InsuranceClaims from './components/billing/InsuranceClaims';

// Telemedicine components
import TelemedicineRoom from './components/telemedicine/TelemedicineRoom';
import UpcomingSessions from './components/telemedicine/UpcomingSessions';
import SessionHistory from './components/telemedicine/SessionHistory';

// Documents components
import DocumentsList from './components/documents/DocumentsList';
import DocumentUpload from './components/documents/DocumentUpload';
import DocumentViewer from './components/documents/DocumentViewer';
import SecureSharing from './components/documents/SecureSharing';

// Messaging components
import Inbox from './components/messaging/Inbox';
import Conversation from './components/messaging/Conversation';
import NewMessage from './components/messaging/NewMessage';

// Staff components (for doctors/admins)
import StaffDashboard from './components/staff/Dashboard';
import PatientList from './components/staff/PatientList';
import PatientDetails from './components/staff/PatientDetails';
import StaffScheduling from './components/staff/Scheduling';
import DoctorAvailability from './components/staff/DoctorAvailability';

// Analytics components
import AnalyticsDashboard from './components/analytics/Dashboard';
import PatientOutcomes from './components/analytics/PatientOutcomes';
import PracticeMetrics from './components/analytics/PracticeMetrics';

// Emergency components
import EmergencyAlerts from './components/emergency/Alerts';
import EmergencyContact from './components/emergency/Contact';

// Imaging components
import ImagingList from './components/imaging/ImagingList';
import ImagingDetails from './components/imaging/ImagingDetails';
import ImagingUpload from './components/imaging/ImagingUpload';

// Error and utility components
import NotFound from './components/common/NotFound';
import AccessDenied from './components/common/AccessDenied';
import TermsOfService from './components/legal/TermsOfService';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import HipaaConsent from './components/auth/HipaaConsent';

// Protected route component
const ProtectedRoute = ({ element, allowedRoles, ...props }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has accepted HIPAA consent
  if (isAuthenticated && !user.hipaaConsent?.status === 'accepted') {
    return <Navigate to="/hipaa-consent" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error("You don't have permission to access this page");
    return <Navigate to="/" replace />;
  }

  return element;
};

// Main App component
const App = () => {
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = () => {
      const newSocket = io(process.env.REACT_APP_API_URL || window.location.origin, {
        path: process.env.REACT_APP_SOCKET_PATH || '/ws',
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setSocketConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        setSocketConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error. Some features may be unavailable.');
      });

      newSocket.on('notification', (data) => {
        toast.info(data.message, {
          onClick: () => {
            // Handle notification click (e.g., navigate to relevant page)
            if (data.link) {
              window.location.href = data.link;
            }
          },
        });
      });

      setSocket(newSocket);

      return newSocket;
    };

    const socket = initSocket();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Socket context value
  const socketContextValue = {
    socket,
    connected: socketConnected,
    // Add helper methods for socket communication
    emit: (event, data, callback) => {
      if (socket && socketConnected) {
        socket.emit(event, data, callback);
      } else {
        toast.error('Not connected to server. Please try again later.');
      }
    },
    subscribe: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
      return () => {};
    },
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider value={socketContextValue}>
          <Router>
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/hipaa-consent" element={<HipaaConsent />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={<ProtectedRoute element={<Dashboard />} />}
                />

                {/* Admin routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute
                      element={<div>Admin Dashboard (to be implemented)</div>}
                      allowedRoles={['admin']}
                    />
                  }
                />

                {/* Doctor routes */}
                <Route
                  path="/doctor/*"
                  element={
                    <ProtectedRoute
                      element={<div>Doctor Dashboard (to be implemented)</div>}
                      allowedRoles={['doctor']}
                    />
                  }
                />

                {/* Nurse routes */}
                <Route
                  path="/nurse/*"
                  element={
                    <ProtectedRoute
                      element={<div>Nurse Dashboard (to be implemented)</div>}
                      allowedRoles={['nurse']}
                    />
                  }
                />

                {/* Common protected routes */}
                <Route
                  path="/appointments/*"
                  element={
                    <ProtectedRoute
                      element={<div>Appointments (to be implemented)</div>}
                    />
                  }
                />

                <Route
                  path="/medical-records/*"
                  element={
                    <ProtectedRoute
                      element={<div>Medical Records (to be implemented)</div>}
                    />
                  }
                />

                <Route
                  path="/messages/*"
                  element={
                    <ProtectedRoute
                      element={<div>Messages (to be implemented)</div>}
                    />
                  }
                />

                <Route
                  path="/telemedicine/*"
                  element={
                    <ProtectedRoute
                      element={<div>Telemedicine (to be implemented)</div>}
                    />
                  }
                />

                <Route
                  path="/billing/*"
                  element={
                    <ProtectedRoute
                      element={<div>Billing (to be implemented)</div>}
                    />
                  }
                />

                <Route
                  path="/health-metrics/*"
                  element={
                    <ProtectedRoute
                      element={<div>Health Metrics (to be implemented)</div>}
                    />
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute
                      element={<div>Profile (to be implemented)</div>}
                    />
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute
                      element={<div>Settings (to be implemented)</div>}
                    />
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute
                      element={<div>Notifications (to be implemented)</div>}
                    />
                  }
                />

                {/* Public information pages */}
                <Route path="/help" element={<div>Help Center (to be implemented)</div>} />
                <Route path="/faq" element={<div>FAQ (to be implemented)</div>} />
                <Route path="/privacy" element={<div>Privacy Policy (to be implemented)</div>} />
                <Route path="/terms" element={<div>Terms of Service (to be implemented)</div>} />
                <Route path="/hipaa" element={<div>HIPAA Information (to be implemented)</div>} />

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Wrap App with necessary providers
const AppWithAuth = () => {
  return <App />;
};

export default AppWithAuth; 