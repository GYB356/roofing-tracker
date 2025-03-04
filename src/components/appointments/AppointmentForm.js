import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiCalendar, FiClock, FiUser, FiFileText, FiX, FiCheck } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AppointmentForm = ({ appointment, onClose }) => {
  const { currentUser } = useAuth();
  const isEditing = !!appointment;
  
  const [formData, setFormData] = useState({
    title: '',
    startTime: new Date(),
    endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
    providerId: '',
    patientId: '',
    notes: '',
    type: 'general',
    location: 'in-person',
    status: 'scheduled'
  });
  
  const [providers, setProviders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // If editing, populate form with appointment data
    if (isEditing && appointment) {
      setFormData({
        title: appointment.title || '',
        startTime: new Date(appointment.startTime),
        endTime: new Date(appointment.endTime),
        providerId: appointment.provider?._id || '',
        patientId: appointment.patient?._id || '',
        notes: appointment.notes || '',
        type: appointment.type || 'general',
        location: appointment.location || 'in-person',
        status: appointment.status || 'scheduled'
      });
    }
    
    // Load providers and patients based on user role
    fetchUsersForAppointment();
  }, [appointment]);
  
  const fetchUsersForAppointment = async () => {
    setLoading(true);
    try {
      // If user is a patient, fetch providers
      if (currentUser.role === 'patient') {
        const response = await fetch('/api/users/providers', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        
        const data = await response.json();
        setProviders(data);
        
        // Set current user as patient
        setFormData(prev => ({
          ...prev,
          patientId: currentUser._id
        }));
      } 
      // If user is a provider, fetch patients
      else if (currentUser.role === 'doctor' || currentUser.role === 'admin') {
        const response = await fetch('/api/users/patients', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }
        
        const data = await response.json();
        setPatients(data);
        
        // Set current user as provider if they are a doctor
        if (currentUser.role === 'doctor') {
          setFormData(prev => ({
            ...prev,
            providerId: currentUser._id
          }));
        }
      }
    } catch (err) {
      setError('Error loading users. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
    
    // If changing start time, adjust end time to be 1 hour later
    if (field === 'startTime') {
      const endTime = new Date(date);
      endTime.setHours(date.getHours() + 1);
      setFormData(prev => ({
        ...prev,
        endTime
      }));
    }
  };
  
  const validateForm = () => {
    if (!formData.title) {
      setError('Please enter an appointment title');
      return false;
    }
    
    if (!formData.startTime || !formData.endTime) {
      setError('Please select a valid date and time');
      return false;
    }
    
    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return false;
    }
    
    if (currentUser.role !== 'patient' && !formData.patientId) {
      setError('Please select a patient');
      return false;
    }
    
    if (currentUser.role !== 'doctor' && !formData.providerId) {
      setError('Please select a provider');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const url = isEditing 
        ? `/api/appointments/${appointment._id}` 
        : '/api/appointments';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save appointment');
      }
      
      // Close the form on success
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving appointment. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {isEditing ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 m-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiX className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Appointment Title
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Annual Check-up"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date & Time
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <DatePicker
                  selected={formData.startTime}
                  onChange={(date) => handleDateChange(date, 'startTime')}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  minDate={new Date()}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date & Time
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiClock className="h-5 w-5 text-gray-400" />
                </div>
                <DatePicker
                  selected={formData.endTime}
                  onChange={(date) => handleDateChange(date, 'endTime')}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  minDate={formData.startTime}
                />
              </div>
            </div>
          </div>
          
          {currentUser.role !== 'patient' && (
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Patient
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="patientId"
                  id="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  className="pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {currentUser.role !== 'doctor' && (
            <div>
              <label htmlFor="providerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Healthcare Provider
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="providerId"
                  id="providerId"
                  value={formData.providerId}
                  onChange={handleChange}
                  className="pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider._id} value={provider._id}>
                      Dr. {provider.firstName} {provider.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Appointment Type
              </label>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="general">General Check-up</option>
                <option value="specialist">Specialist Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="procedure">Procedure</option>
                <option value="lab">Lab Work</option>
                <option value="imaging">Imaging</option>
                <option value="therapy">Therapy</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <select
                name="location"
                id="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="in-person">In-Person</option>
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
                <option value="home">Home Visit</option>
              </select>
            </div>
          </div>
          
          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          )}
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Any additional information or special requests"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                submitting
                  ? 'bg-primary-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <FiCheck className="mr-2" />
                  {isEditing ? 'Update Appointment' : 'Create Appointment'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;