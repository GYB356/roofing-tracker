export const generateMockData = (user) => {
  // Base data for all roles
  const baseData = {
    notifications: [
      { id: 'notif-1', message: 'Welcome to HealthcareSync', read: false },
      { id: 'notif-2', message: 'Your profile is 80% complete', read: true }
    ]
  };
  
  // Role-specific data
  const roleData = {
    'admin': {
      staffCount: 42,
      revenueData: { mtd: 124850.75, outstanding: 38220.45 },
      systemAlerts: [
        { id: 'alert-1', type: 'critical', message: 'Server disk space low' }
      ]
    },
    'provider': {
      patients: 28,
      appointments: [
        { id: 'appt-1', patient: 'John Smith', time: '2:30 PM', date: '2025-03-15' }
      ]
    },
    'patient': {
      appointments: [
        { id: 'appt-2', doctor: 'Dr. Sarah Johnson', type: 'Checkup', date: '2025-03-18' }
      ],
      prescriptions: [
        { id: 'rx-1', medication: 'Amoxicillin', dosage: '500mg', refills: 2 }
      ],
      healthMetrics: {
        bloodPressure: '120/80',
        heartRate: 72,
        bmi: 24.5
      }
    }
  };
  
  return { ...baseData, ...(roleData[user.role] || {}) };
}; 