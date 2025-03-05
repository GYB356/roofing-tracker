// src/components/appointments/AppointmentForm.js
import React, { useState, useEffect } from 'react';
import { useAppointments } from '../../contexts/AppointmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, addMinutes, set } from 'date-fns';

// Mock data for providers - in a real app this would come from an API
const PROVIDERS = [
  { id: 'provider-1', name: 'Dr. Sarah Johnson', specialty: 'Primary Care' },
  { id: 'provider-2', name: 'Dr. Robert Chen', specialty: 'Cardiology' },
  { id: 'provider-3', name: 'Dr. Maria Rodriguez', specialty: 'Pediatrics' },
];

// Mock data for appointment types - in a real app this would come from an API
const APPOINTMENT_TYPES = [
  { id: 'annual-physical', name: 'Annual Physical', duration: 30 },
  { id: 'follow-up', name: 'Follow-up Visit', duration: 15 },
  { id: 'consultation', name: 'New Patient Consultation', duration: 45 },
  { id: 'vaccination', name: 'Vaccination', duration: 15 },
  { id: 'lab-results', name: 'Lab Results Review', duration: 20 },
];

// Mock data for locations - in a real app this would come from an API
const LOCATIONS = [
  { id: 'loc-1', name: 'Main Clinic - Room 101', address: '123 Healthcare Ave, Medical District, CA 90210' },
  { id: 'loc-2', name: 'Main Clinic - Room 202', address: '123 Healthcare Ave, Medical District, CA 90210' },
  { id: 'loc-3', name: 'Telehealth Virtual Room', address: 'Online' },
];

const AppointmentForm = ({ appointmentId, onSuccess, onCancel }) => {
  const { createAppointment, updateAppointment, getAppointmentById } = useAppointments();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    providerId: '',
    appointmentType: '',
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    duration: 30,
    locationId: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // If appointmentId is provided, load existing appointment data
  useEffect(() => {
    if (appointmentId) {
      const appointment = getAppointmentById(appointmentId);
      
      if (appointment) {
        setIsEditing(true);
        
        // Extract time parts from the appointment
        const startDate = new Date(appointment.startTime);
        
        // Calculate duration in minutes
        const endDate = new Date(appointment.endTime);
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        
        // Format date and time for form inputs
        const formattedDate = format(startDate, 'yyyy-MM-dd');
        const formattedTime = format(startDate, 'HH:mm');
        
        // Set form data
        setFormData({
          providerId: appointment.providerId,
          appointmentType: appointment.type || '',
          title: appointment.title,
          description: appointment.description || '',
          date: formattedDate,
          time: formattedTime,
          duration: durationMinutes,
          locationId: appointment.location?.id || '',
          notes: appointment.notes || '',
        });
      }
    } else {
      // If creating a new appointment, set patient ID to current user if they're a patient
      if (currentUser.role === 'patient') {
        setFormData(prev => ({
          ...prev,
          patientId: currentUser.id
        }));
      } else if (['doctor', 'nurse'].includes(currentUser.role)) {
        // If provider is creating the appointment, set provider ID to current user
        setFormData(prev => ({
          ...prev,
          providerId: currentUser.id
        }));
      }
    }
  }, [appointmentId, getAppointmentById, currentUser]);
  
  // Update form data
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // If appointment type changes, update duration
    if (name === 'appointmentType') {
      const selectedType = APPOINTMENT_TYPES.find(type => type.id === value);
      if (selectedType) {
        setFormData(prev => ({ ...prev, duration: selectedType.duration }));
      }
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    const requiredFields = [
      'providerId',
      'appointmentType',
      'title',
      'date',
      'time',
      'locationId'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // If user is not a patient and patient ID is not set
    if (!isEditing && !currentUser.role === 'patient' && !formData.patientId) {
      newErrors.patientId = 'Please select a patient';
    }
    
    // Validate date is not in the past
    const appointmentDate = new Date(`${formData.date}T${formData.time}`);
    if (appointmentDate < new Date()) {
      newErrors.date = 'Appointment date and time cannot be in the past';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate start and end times
      const startTime = new Date(`${formData.date}T${formData.time}`);
      const endTime = addMinutes(startTime, formData.duration);
      
      // Prepare appointment data
      const appointmentData = {
        patientId: formData.patientId || (currentUser.role === 'patient' ? currentUser.id : ''),
        providerId: formData.providerId,
        title: formData.title,
        description: formData.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        type: formData.appointmentType,
        location: LOCATIONS.find(loc => loc.id === formData.locationId),
        notes: formData.notes
      };
      
      let result;
      
      if (isEditing) {
        result = await updateAppointment(appointmentId, appointmentData);
      } else {
        result = await createAppointment(appointmentData);
      }
      
      if (result.success) {
        if (onSuccess) {
          onSuccess(result.appointment);
        }
      } else {
        setErrors({ submit: result.message });
      }
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Edit Appointment' : 'Schedule New Appointment'}
      </h2>
      
      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
          {errors.submit}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Provider Selection */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Healthcare Provider*
            </label>
            <select
              name="providerId"
              value={formData.providerId}
              onChange={handleChange}
              disabled={currentUser.role === 'doctor' || loading}
              className={`w-full p-2 border rounded ${errors.providerId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Provider</option>
              {PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} - {provider.specialty}
                </option>
              ))}
            </select>
            {errors.providerId && (
              <p className="mt-1 text-sm text-red-600">{errors.providerId}</p>
            )}
          </div>
          
          {/* Appointment Type */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Type*
            </label>
            <select
              name="appointmentType"
              value={formData.appointmentType}
              onChange={handleChange}
              disabled={loading}
              className={`w-full p-2 border rounded ${errors.appointmentType ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Type</option>
              {APPOINTMENT_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.duration} mins)
                </option>
              ))}
            </select>
            {errors.appointmentType && (
              <p className="mt-1 text-sm text-red-600">{errors.appointmentType}</p>
            )}
          </div>
          
          {/* Appointment Title */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Title*
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              className={`w-full p-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Annual Physical Exam"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>
          
          {/* Date and Time */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date*
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              disabled={loading}
              className={`w-full p-2 border rounded ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time*
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              disabled={loading}
              className={`w-full p-2 border rounded ${errors.time ? 'border-red-500' : 'border-gray-300'}`}
              step="900" // 15-minute intervals
            />
            {errors.time && (
              <p className="mt-1 text-sm text-red-600">{errors.time}</p>
            )}
          </div>
          
          {/* Duration */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded"
              min="5"
              max="240"
              step="5"
            />
          </div>
          
          {/* Location */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location*
            </label>
            <select
              name="locationId"
              value={formData.locationId}
              onChange={handleChange}
              disabled={loading}
              className={`w-full p-2 border rounded ${errors.locationId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select Location</option>
              {LOCATIONS.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            {errors.locationId && (
              <p className="mt-1 text-sm text-red-600">{errors.locationId}</p>
            )}
          </div>
          
          {/* Notes */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded"
              rows="3"
              placeholder="Any special instructions or information for this appointment?"
            ></textarea>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
          >
            {loading ? 'Processing...' : isEditing ? 'Update Appointment' : 'Schedule Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;