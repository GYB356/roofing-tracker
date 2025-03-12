import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon, 
  ClockIcon,
  UserIcon,
  ExclamationCircleIcon
} from '@heroicons/react/outline';
import { appointmentAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const AppointmentScheduler = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentType, setAppointmentType] = useState('Regular Check-up');
  const [notes, setNotes] = useState('');
  
  const [doctors, setDoctors] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [weekDays, setWeekDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Appointment types
  const appointmentTypes = [
    'Regular Check-up',
    'Follow-up',
    'Emergency',
    'Consultation',
    'Procedure',
    'Telemedicine'
  ];
  
  // Generate week days
  useEffect(() => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDate, i));
    }
    
    setWeekDays(days);
  }, [currentDate]);
  
  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // In a real app, you'd fetch doctors from your API
        const response = await fetch('/api/doctors');
        const data = await response.json();
        setDoctors(data);
        
        // If there are doctors, select the first one by default
        if (data.length > 0) {
          setSelectedDoctor(data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setError('Failed to load doctors. Please try again later.');
      }
    };
    
    fetchDoctors();
  }, []);
  
  // Fetch available time slots when date or doctor changes
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!selectedDoctor) return;
      
      try {
        setLoading(true);
        
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await appointmentAPI.getDoctorAvailability(
          selectedDoctor, 
          formattedDate
        );
        
        setAvailableTimeSlots(response.data);
        setSelectedTimeSlot(null); // Reset selected time slot
        setLoading(false);
      } catch (error) {
        console.error('Error fetching available time slots:', error);
        setError('Failed to load available time slots. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchAvailableTimeSlots();
  }, [selectedDate, selectedDoctor]);
  
  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };
  
  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };
  
  // Date selection
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };
  
  // Time slot selection
  const handleTimeSlotClick = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !selectedTimeSlot || !appointmentReason || !appointmentType) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Prepare appointment data
      const appointmentData = {
        patientId: currentUser.patientId, // You would have this from your auth context
        doctorId: selectedDoctor,
        scheduledDate: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        appointmentType,
        reason: appointmentReason,
        notes,
        createdBy: currentUser.id
      };
      
      // Create appointment
      const response = await appointmentAPI.createAppointment(appointmentData);
      
      setSuccess('Appointment scheduled successfully!');
      setLoading(false);
      
      // Redirect to appointment details page
      setTimeout(() => {
        navigate(`/appointments/${response.data._id}`);
      }, 2000);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      setError(
        error.response?.data?.message || 
        'Failed to schedule appointment. Please try again later.'
      );
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">Schedule an Appointment</h2>
      </div>
      
      <div className="p-6">
        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Doctor selection */}
          <div className="mb-6">
            <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
              Select a Doctor <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="doctor"
                name="doctor"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Date selection */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select a Date <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={goToPreviousWeek}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={goToNextWeek}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`p-2 text-center rounded-md focus:outline-none ${
                    isSameDay(day, selectedDate)
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-medium">
                    {format(day, 'EEE')}
                  </div>
                  <div className="mt-1 font-semibold">
                    {format(day, 'd')}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Time slot selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Time Slot <span className="text-red-500">*</span>
            </label>
            
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <p className="text-sm text-gray-600 py-2">
                No available time slots for the selected date. Please choose another date.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {availableTimeSlots.map(timeSlot => (
                  <button
                    key={timeSlot.start}
                    type="button"
                    onClick={() => handleTimeSlotClick(timeSlot)}
                    className={`flex items-center justify-center p-2 border rounded-md focus:outline-none ${
                      selectedTimeSlot === timeSlot
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>{timeSlot.formatted}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Appointment type */}
          <div className="mb-6">
            <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700">
              Appointment Type <span className="text-red-500">*</span>
            </label>
            <select
              id="appointmentType"
              name="appointmentType"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              {appointmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Reason for appointment */}
          <div className="mb-6">
            <label htmlFor="appointmentReason" className="block text-sm font-medium text-gray-700">
              Reason for Appointment <span className="text-red-500">*</span>
            </label>
            <textarea
              id="appointmentReason"
              name="appointmentReason"
              rows={3}
              value={appointmentReason}
              onChange={(e) => setAppointmentReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Please describe the reason for your appointment"
              required
            />
          </div>
          
          {/* Additional notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Any additional information you would like to provide"
            />
          </div>
          
          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler; 