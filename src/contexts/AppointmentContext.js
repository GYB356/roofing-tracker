// src/contexts/AppointmentContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppointmentContext = createContext(null);

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();

  // Load appointments from localStorage or API
  useEffect(() => {
    const loadAppointments = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // In mock implementation, load from localStorage
        let userAppointments = [];
        const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        
        if (currentUser.role === 'patient') {
          // Filter appointments for this patient
          userAppointments = storedAppointments.filter(apt => apt.patientId === currentUser.id);
        } else if (['doctor', 'nurse'].includes(currentUser.role)) {
          // Filter appointments for this provider
          userAppointments = storedAppointments.filter(apt => apt.providerId === currentUser.id);
        } else if (currentUser.role === 'admin') {
          // Admins see all appointments
          userAppointments = storedAppointments;
        }
        
        setAppointments(userAppointments);
      } catch (err) {
        console.error('Failed to load appointments:', err);
        setError('Failed to load appointments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadAppointments();
  }, [currentUser, isAuthenticated]);

  // CRUD operations
  const createAppointment = async (appointmentData) => {
    try {
      // Validate required fields
      const requiredFields = ['patientId', 'providerId', 'title', 'startTime', 'endTime'];
      for (const field of requiredFields) {
        if (!appointmentData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      // Validate time logic
      const start = new Date(appointmentData.startTime);
      const end = new Date(appointmentData.endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (start >= end) {
        throw new Error('End time must be after start time');
      }
      
      if (start < new Date()) {
        throw new Error('Cannot schedule appointments in the past');
      }
      
      // Check for scheduling conflicts
      const conflictingAppointments = appointments.filter(apt => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        
        return (
          apt.providerId === appointmentData.providerId &&
          apt.status !== 'cancelled' &&
          ((start >= aptStart && start < aptEnd) || 
           (end > aptStart && end <= aptEnd) ||
           (start <= aptStart && end >= aptEnd))
        );
      });
      
      if (conflictingAppointments.length > 0) {
        throw new Error('This time slot conflicts with an existing appointment');
      }
      
      // Create new appointment
      const newAppointment = {
        ...appointmentData,
        id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'scheduled',
        reminders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update state and localStorage
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      allAppointments.push(newAppointment);
      localStorage.setItem('appointments', JSON.stringify(allAppointments));
      
      setAppointments([...appointments, newAppointment]);
      
      return { success: true, appointment: newAppointment };
    } catch (err) {
      console.error('Failed to create appointment:', err);
      return { success: false, message: err.message };
    }
  };

  const updateAppointment = async (id, updates) => {
    try {
      // Find appointment
      const appointmentIndex = appointments.findIndex(apt => apt.id === id);
      if (appointmentIndex === -1) {
        throw new Error('Appointment not found');
      }
      
      // Validate updates
      if (updates.startTime || updates.endTime) {
        const start = new Date(updates.startTime || appointments[appointmentIndex].startTime);
        const end = new Date(updates.endTime || appointments[appointmentIndex].endTime);
        
        if (start >= end) {
          throw new Error('End time must be after start time');
        }
        
        // Check for conflicts if time is changed
        if (updates.startTime || updates.endTime) {
          const conflictingAppointments = appointments.filter(apt => {
            if (apt.id === id) return false; // Exclude this appointment
            
            const aptStart = new Date(apt.startTime);
            const aptEnd = new Date(apt.endTime);
            
            return (
              apt.providerId === (updates.providerId || appointments[appointmentIndex].providerId) &&
              apt.status !== 'cancelled' &&
              ((start >= aptStart && start < aptEnd) || 
               (end > aptStart && end <= aptEnd) ||
               (start <= aptStart && end >= aptEnd))
            );
          });
          
          if (conflictingAppointments.length > 0) {
            throw new Error('This time slot conflicts with an existing appointment');
          }
        }
      }
      
      // Update appointment
      const updatedAppointment = {
        ...appointments[appointmentIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      const updatedAppointments = [...appointments];
      updatedAppointments[appointmentIndex] = updatedAppointment;
      
      // Update state and localStorage
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const allAppointmentIndex = allAppointments.findIndex(apt => apt.id === id);
      
      if (allAppointmentIndex !== -1) {
        allAppointments[allAppointmentIndex] = updatedAppointment;
        localStorage.setItem('appointments', JSON.stringify(allAppointments));
      }
      
      setAppointments(updatedAppointments);
      
      return { success: true, appointment: updatedAppointment };
    } catch (err) {
      console.error('Failed to update appointment:', err);
      return { success: false, message: err.message };
    }
  };

  const cancelAppointment = async (id, reason) => {
    try {
      return await updateAppointment(id, { 
        status: 'cancelled', 
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user' 
      });
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      return { success: false, message: err.message };
    }
  };

  // Filter and utility functions
  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments
      .filter(apt => new Date(apt.startTime) > now && apt.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

  const getPastAppointments = () => {
    const now = new Date();
    return appointments
      .filter(apt => new Date(apt.startTime) < now || apt.status === 'completed')
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  };

  const getAppointmentById = (id) => {
    return appointments.find(apt => apt.id === id);
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      loading,
      error,
      createAppointment,
      updateAppointment,
      cancelAppointment,
      getUpcomingAppointments,
      getPastAppointments,
      getAppointmentById
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};