// services/api.js
import axios from 'axios';

// Create custom axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const originalRequest = error.config;
    
    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If token is expired, log out
      if (error.response.data.message === 'Token expired') {
        // Clear auth data
        localStorage.removeItem('auth_token');
        
        // Redirect to login page
        window.location.href = '/login?expired=true';
        return Promise.reject(error);
      }
      
      // For other 401 errors, let the components handle them
      return Promise.reject(error);
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error detected');
      // You could dispatch a global notification here
    }
    
    return Promise.reject(error);
  }
);

// API service functions

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token })
};

// Patient API
export const patientAPI = {
  getAllPatients: (params) => api.get('/patients', { params }),
  getPatientById: (id) => api.get(`/patients/${id}`),
  createPatient: (patientData) => api.post('/patients', patientData),
  updatePatient: (id, patientData) => api.put(`/patients/${id}`, patientData),
  deletePatient: (id) => api.delete(`/patients/${id}`),
  getPatientHealthMetrics: (id) => api.get(`/patients/${id}/health-metrics`),
  getPatientMedicalRecords: (id, params) => api.get(`/patients/${id}/medical-records`, { params }),
  searchPatients: (searchTerm) => api.get(`/patients/search?term=${searchTerm}`)
};

// Appointment API
export const appointmentAPI = {
  getAllAppointments: (params) => api.get('/appointments', { params }),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
  createAppointment: (appointmentData) => api.post('/appointments', appointmentData),
  updateAppointment: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
  getPatientAppointments: (patientId, params) => api.get(`/patients/${patientId}/appointments`, { params }),
  getDoctorAppointments: (doctorId, params) => api.get(`/doctors/${doctorId}/appointments`, { params }),
  getDoctorAvailability: (doctorId, date) => api.get(`/appointments/availability/${doctorId}?date=${date}`)
};

// Medical Records API
export const medicalRecordsAPI = {
  getAllMedicalRecords: (params) => api.get('/medical-records', { params }),
  getMedicalRecordById: (id) => api.get(`/medical-records/${id}`),
  createMedicalRecord: (recordData) => api.post('/medical-records', recordData),
  updateMedicalRecord: (id, recordData) => api.put(`/medical-records/${id}`, recordData),
  deleteMedicalRecord: (id) => api.delete(`/medical-records/${id}`),
  uploadAttachment: (recordId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/medical-records/${recordId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getLabResults: (patientId, params) => api.get(`/patients/${patientId}/lab-results`, { params }),
  getImagingStudies: (patientId, params) => api.get(`/patients/${patientId}/imaging`, { params })
};

// Billing API
export const billingAPI = {
  getAllInvoices: (params) => api.get('/billing/invoices', { params }),
  getInvoiceById: (id) => api.get(`/billing/invoices/${id}`),
  createInvoice: (invoiceData) => api.post('/billing/invoices', invoiceData),
  updateInvoice: (id, invoiceData) => api.put(`/billing/invoices/${id}`, invoiceData),
  deleteInvoice: (id) => api.delete(`/billing/invoices/${id}`),
  getPatientInvoices: (patientId, params) => api.get(`/patients/${patientId}/invoices`, { params }),
  payInvoice: (id, paymentData) => api.post(`/billing/invoices/${id}/pay`, paymentData),
  getPaymentMethods: () => api.get('/billing/payment-methods'),
  addPaymentMethod: (paymentData) => api.post('/billing/payment-methods', paymentData),
  deletePaymentMethod: (id) => api.delete(`/billing/payment-methods/${id}`)
};

// Dashboard API
export const dashboardAPI = {
  getPatientDashboard: () => api.get('/patients/dashboard'),
  getDoctorDashboard: () => api.get('/doctors/dashboard'),
  getAdminDashboard: () => api.get('/admin/dashboard')
};

// Export the API instance
export default api;