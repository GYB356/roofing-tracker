import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  Activity, 
  Heart, 
  Pill, 
  CreditCard,
  X,
  Check,
  AlertTriangle,
  Edit,
  ChevronRight
} from 'lucide-react';

// Enhanced mock data with more comprehensive information
const getMockPatientData = () => ({
  patientInfo: {
    name: 'Emma Johnson',
    age: 35,
    bloodType: 'A+',
    contactInfo: {
      email: 'emma.johnson@example.com',
      phone: '(555) 123-4567'
    },
    emergencyContact: {
      name: 'Michael Johnson',
      relationship: 'Spouse',
      phone: '(555) 987-6543'
    }
  },
  upcomingAppointments: [
    {
      id: 1,
      date: '2024-03-15',
      time: '10:00 AM',
      doctor: 'Dr. Sarah Lee',
      specialty: 'Endocrinology',
      location: 'City Medical Center',
      status: 'Scheduled'
    },
    {
      id: 2,
      date: '2024-04-02',
      time: '2:30 PM',
      doctor: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      location: 'Heart Clinic',
      status: 'Pending Confirmation'
    }
  ],
  medications: [
    { 
      id: 1,
      name: 'Insulin Glargine', 
      dosage: '20mg', 
      schedule: 'Once daily', 
      startDate: '2023-11-01',
      endDate: null,
      prescribedBy: 'Dr. Sarah Lee',
      refillsRemaining: 2
    },
    { 
      id: 2,
      name: 'Metformin', 
      dosage: '500mg', 
      schedule: 'Twice daily', 
      startDate: '2023-09-15',
      endDate: null,
      prescribedBy: 'Dr. Emily Wong',
      refillsRemaining: 1
    }
  ],
  healthMetrics: {
    bloodPressure: {
      current: '120/80',
      history: [
        { date: '2024-02-01', value: '118/76' },
        { date: '2024-01-15', value: '122/82' },
        { date: '2023-12-01', value: '125/85' }
      ]
    },
    bloodSugar: {
      fasting: 95,
      postMeal: 140,
      trend: 'stable',
      history: [
        { date: '2024-02-01', fasting: 92, postMeal: 135 },
        { date: '2024-01-15', fasting: 98, postMeal: 145 },
        { date: '2023-12-01', fasting: 100, postMeal: 150 }
      ]
    },
    heartRate: {
      current: 72,
      history: [
        { date: '2024-02-01', value: 70 },
        { date: '2024-01-15', value: 75 },
        { date: '2023-12-01', value: 68 }
      ]
    }
  },
  medicalRecords: 5,
  pendingBills: 250,
  alerts: [
    {
      id: 1,
      type: 'warning',
      message: 'Blood sugar levels slightly elevated',
      severity: 'medium',
      date: '2024-03-01'
    }
  ],
  quickActions: [
    {
      id: 1,
      icon: Calendar,
      label: 'Schedule Appointment',
      color: 'bg-blue-600',
      action: () => {}
    },
    {
      id: 2,
      icon: Pill,
      label: 'Medication Refill',
      color: 'bg-green-600',
      action: () => {}
    },
    {
      id: 3,
      icon: FileText,
      label: 'Medical Records',
      color: 'bg-purple-600',
      action: () => {}
    },
    {
      id: 4,
      icon: CreditCard,
      label: 'Pay Bill',
      color: 'bg-yellow-600',
      action: () => {}
    }
  ]
});

const PatientDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        const data = await new Promise((resolve) => {
          setTimeout(() => {
            resolve(getMockPatientData());
          }, 500);
        });
        
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Dashboard data fetch error', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Dashboard Error
          </h2>
          <p className="text-gray-600 mb-4">
            Unable to load dashboard data. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Quick Actions Section
  const QuickActionsSection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Quick Actions
        </h3>
        <Activity className="h-5 w-5 text-indigo-500" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {dashboardData.quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center justify-center hover:opacity-90 transition-opacity`}
          >
            <action.icon className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium text-center">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Patient Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Welcome back, {dashboardData.patientInfo.name}!
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Upcoming Appointments
              </h3>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {dashboardData.upcomingAppointments.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Active Medications
              </h3>
              <Pill className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {dashboardData.medications.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Medical Records
              </h3>
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {dashboardData.medicalRecords}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Pending Bills
              </h3>
              <CreditCard className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${dashboardData.pendingBills}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActionsSection />
      </div>
    </div>
  );
};

export default PatientDashboard;