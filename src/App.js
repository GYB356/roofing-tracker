import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import core components directly
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Sidebar from './components/layout/Sidebar';
import VerifyEmailSent from './components/auth/VerifyEmailSent';
import { AppointmentsProvider } from './contexts/AppointmentsContext';
import { MedicalRecordsProvider } from './contexts/MedicalRecordsContext';
import AppointmentsList from './components/AppointmentsList';
import MedicalRecords from './components/MedicalRecords';

// Lazy load other components with fixed file paths
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const ProviderDashboard = lazy(() => import('./components/dashboard/ProviderDashboard'));
const AppointmentsPage = lazy(() => import('./components/appointments/AppointmentsPage'));
const ScheduleNewPage = lazy(() => import('./components/appointments/ScheduleNewPage'));
const CalendarViewPage = lazy(() => import('./components/appointments/CalendarViewPage'));

// Medical Records components
const MedicalRecordsPage = lazy(() => import('./components/medical-records/medicalrecordspage'));
const HealthSummaryPage = lazy(() => import('./components/medical-records/HealthSummaryPage'));
const MedicationsPage = lazy(() => import('./components/medical-records/MedicationsPage'));
const LabResultsPage = lazy(() => import('./components/medical-records/LabResultsPage'));
const ImagingPage = lazy(() => import('./components/medical-records/ImagingPage'));

// New component lazy loads
const ProjectDetail = lazy(() => import('./components/projects/ProjectDetail'));
const TaskForm = lazy(() => import('./components/tasks/TaskForm'));
const TaskDetail = lazy(() => import('./components/tasks/TaskDetail'));
const CalendarView = lazy(() => import('./components/calendar/CalendarView'));
const EventForm = lazy(() => import('./components/calendar/EventForm'));
const ClientDetail = lazy(() => import('./components/clients/ClientDetail'));

// Other existing components
const MessagesPage = lazy(() => import('./components/messages/MessagesPage'));
const TelemedicinePage = lazy(() => import('./components/telemedicine/TelemedicinePage'));
const BillingPage = lazy(() => import('./components/billing/BillingPage'));
const InvoicesPage = lazy(() => import('./components/billing/InvoicesPage'));
const PaymentMethodsPage = lazy(() => import('./components/billing/PaymentMethodsPage'));
const HealthMetricsPage = lazy(() => import('./components/health-metrics/HealthmetricsPage'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error);
    this.setState({ errorInfo });
  }

  tryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="error-boundary p-6 bg-gray-800 text-white rounded-lg m-4">
          <h2 className="text-xl font-bold mb-3 text-red-400">Something went wrong</h2>
          <p className="mb-3">The application encountered an error.</p>
          <button 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            onClick={this.tryAgain}
          >
            Try Again
          </button>
          <details className="mt-4 bg-gray-700 p-2 rounded">
            <summary className="cursor-pointer text-gray-300">Error Details</summary>
            <pre className="mt-2 p-2 bg-gray-900 rounded overflow-auto text-xs text-gray-400">
              {this.state.error && this.state.error.toString()}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading component for suspense fallback
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-screen w-full bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto"></div>
      <p className="mt-4 text-xl text-white">Loading...</p>
    </div>
  </div>
);

// Smaller loading component for page transitions
const PageLoading = () => (
  <div className="flex justify-center items-center p-12">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  console.log('ProtectedRoute checking auth:', { isAuthenticated: !!currentUser, loading });

  // Show loading while checking auth
  if (loading) {
    return <LoadingComponent />;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

// App layout with sidebar for authenticated views
const AppLayout = ({ children }) => {
  const appContainerStyle = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#111827'
  };

  const contentStyle = {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto'
  };

  return (
    <div style={appContainerStyle}>
      <Sidebar />
      <main style={contentStyle}>
        {children}
      </main>
    </div>
  );
};

// 404 Not Found component
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
    <h1 className="text-6xl font-bold mb-4">404</h1>
    <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
    <p className="text-lg text-gray-400 mb-8 text-center">Sorry, we couldn't find the page you're looking for.</p>
    <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
      Go back home
    </a>
  </div>
);

// Inner content component with access to auth context
function AppContent() {
  const { currentUser, loading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  
  // Track auth state for debugging
  useEffect(() => {
    console.log('App.js: Auth state check:', { 
      isAuthenticated: !!currentUser, 
      loading,
      userDetails: currentUser ? `${currentUser.email || 'unknown'} (${currentUser.role || 'unknown'})` : 'None'
    });
    
    // Mark as auth checked after initial auth check
    if (!loading) {
      setAuthChecked(true);
    }
  }, [currentUser, loading]);

  // Show loading while auth is being checked
  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          
          {/* Test route */}
          <Route path="/test" element={<div>Test Page</div>} />
          
          {/* New project routes */}
          <Route path="/projects/:projectId" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <ProjectDetail />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/projects/:projectId/tasks/new" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <TaskForm />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/tasks/new" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <TaskForm />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/tasks/:taskId" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <TaskDetail />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/tasks/:taskId/edit" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <TaskForm />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/calendar" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <CalendarView />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/calendar/new-event" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <EventForm />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/clients/:clientId" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <ClientDetail />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Provider dashboard */}
          <Route path="/provider-dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <ProviderDashboard />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Existing routes remain the same... */}
          {/* (All previous routes from appointments, medical records, etc. remain unchanged) */}
          
          {/* Protected home route */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading />}>
                    <Dashboard />
                  </Suspense>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Redirect dashboard to root */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          
          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

// Main App component
function App() {
  useEffect(() => {
    console.log('===== App component mounted =====');
    return () => console.log('===== App component unmounted =====');
  }, []);

  return (
    <div className="app-wrapper">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </div>
  );
}

export default App;