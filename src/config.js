// src/config.js
// Centralized configuration for the application

// API configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const USE_MOCK_API = process.env.REACT_APP_MOCK_API === 'true' || true; // Enable mock API by default

// Feature flags
export const FEATURES = {
  SOCIAL_LOGIN: false,
  EMAIL_VERIFICATION: true,
  PASSWORD_RESET: true
};

// App information
export const APP_INFO = {
  NAME: 'HealthcareSync',
  VERSION: '1.0.0',
  COPYRIGHT_YEAR: 2025
};