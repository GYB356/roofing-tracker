import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ClipboardDocumentListIcon,  // Changed from ClipboardListIcon
  ChartBarIcon, 
  CreditCardIcon, 
  UserIcon, 
  ChatBubbleLeftIcon,  // Changed from ChatIcon
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

// Dashboard card component
const DashboardCard = ({ title, icon, count, linkTo, linkText, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-700">{title}</h3>
            <p className="text-3xl font-bold mt-2">{count}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
        <Link to={linkTo} className="block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
          {linkText} →
        </Link>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    recentMedicalRecords: [],
    pendingBills: [],
    unreadMessages: 0
  });
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check for mock data in localStorage first (for development)
        const mockDataStr = localStorage.getItem('mockDashboardData');
        
        if (mockDataStr) {
          // If mock data exists, use it
          const mockData = JSON.parse(mockDataStr);
          setDashboardData(mockData);
          setLoading(false);
          return;
        }
        
        // If no mock data, make the real API call
        const patientResponse = await axios.get('/api/patients/dashboard', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setDashboardData(patientResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser?.fullName}</h1>
        <p className="text-gray-600 mt-1">Here's your health at a glance</p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard 
          title="Upcoming Appointments" 
          icon={<CalendarIcon className="h-6 w-6 text-white" />}
          count={dashboardData.upcomingAppointments.length}
          linkTo="/appointments"
          linkText="View all appointments"
          color="bg-blue-500"
        />
        
        <DashboardCard 
          title="Medical Records" 
          icon={<ClipboardDocumentListIcon className="h-6 w-6 text-white" />}
          count={dashboardData.recentMedicalRecords.length}
          linkTo="/medical-records"
          linkText="View all records"
          color="bg-green-500"
        />
        
        <DashboardCard 
          title="Pending Bills" 
          icon={<CreditCardIcon className="h-6 w-6 text-white" />}
          count={dashboardData.pendingBills.length}
          linkTo="/billing"
          linkText="View all bills"
          color="bg-yellow-500"
        />
        
        <DashboardCard 
          title="Messages" 
          icon={<ChatBubbleLeftIcon className="h-6 w-6 text-white" />}
          count={dashboardData.unreadMessages}
          linkTo="/messages"
          linkText="View all messages"
          color="bg-purple-500"
        />
      </div>
      
      {/* Upcoming appointments */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Upcoming Appointments</h2>
        </div>
        
        <div className="p-6">
          {dashboardData.upcomingAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {dashboardData.upcomingAppointments.map(appointment => (
                <div key={appointment._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {appointment.appointmentType} with Dr. {appointment.doctorId?.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(appointment.scheduledDate), 'MMMM d, yyyy')} at {format(new Date(appointment.scheduledDate), 'h:mm a')}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex space-x-2">
                    {/* Fixed: changed record._id to appointment._id */}
                    <Link 
                      to={`/appointments/${appointment._id}`}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      Details
                    </Link>
                    <Link 
                      to={`/appointments/${appointment._id}/reschedule`}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
                    >
                      Reschedule
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Link 
              to="/appointments"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Appointments
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent Medical Records */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Recent Medical Records</h2>
        </div>
        
        <div className="p-6">
          {dashboardData.recentMedicalRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent medical records</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {dashboardData.recentMedicalRecords.map(record => (
                <div key={record._id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{record.recordType}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(record.recordDate), 'MMMM d, yyyy')} • Dr. {record.provider?.fullName}
                      </p>
                    </div>
                    <Link
                      to={`/medical-records/${record._id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Link 
              to="/medical-records"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              View All Medical Records
            </Link>
          </div>
        </div>
      </div>
      
      {/* Billing summary */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Billing Summary</h2>
        </div>
        
        <div className="p-6">
          {dashboardData.pendingBills.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending bills</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {dashboardData.pendingBills.map(bill => (
                <div key={bill._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      Invoice #{bill.invoiceNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(bill.dueDate), 'MMMM d, yyyy')} • ${bill.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <Link 
                      to={`/billing/pay/${bill._id}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Pay Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Link 
              to="/billing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
            >
              View Billing History
            </Link>
          </div>
        </div>
      </div>
      
      {/* Health metrics summary */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Health Metrics</h2>
        </div>
        
        <div className="p-6">
          {!dashboardData.healthMetrics ? (
            <p className="text-gray-500 text-center py-4">No health metrics available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Blood Pressure</p>
                <p className="text-2xl font-bold mt-1">
                  {dashboardData.healthMetrics.bloodPressure || 'N/A'}
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Heart Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {dashboardData.healthMetrics.heartRate || 'N/A'} <span className="text-sm font-normal">bpm</span>
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">BMI</p>
                <p className="text-2xl font-bold mt-1">
                  {dashboardData.healthMetrics.bmi || 'N/A'}
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link 
              to="/health-metrics"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              View All Health Metrics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;