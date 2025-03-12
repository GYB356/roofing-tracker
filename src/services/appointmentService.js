import api from './api.js';

const appointmentService = {
  // Get appointments for current user
  getAppointments: async (params = {}) => {
    try {
      const response = await api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
    }
  },

  // Create new appointment
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Appointment creation failed');
    }
  },

  // Update existing appointment
  updateAppointment: async (id, updateData) => {
    try {
      const response = await api.patch(`/appointments/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Appointment update failed');
    }
  },

  // Cancel appointment
  cancelAppointment: async (id) => {
    try {
      const response = await api.delete(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Appointment cancellation failed');
    }
  },

  // Get available time slots
  getAvailability: async (providerId, date) => {
    try {
      const response = await api.get(`/availability/${providerId}`, { 
        params: { date } 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Availability check failed');
    }
  }
};

export default appointmentService;