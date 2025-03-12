// src/index.js - Complete implementation
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Include your styles
import App from './App.js';
import reportWebVitals from './reportWebVitals.js'; // If you're using Create React App

// Import services with proper casing
import AuthService from './services/AuthService.js';
import ProviderService from './services/ProviderService.js';
import setupAxios from './services/api.config.js';

// Initialize global API configuration
// Wrap in try/catch to prevent initialization errors from breaking rendering
try {
  setupAxios();
} catch (error) {
  console.error('Error initializing API configuration:', error);
}

// Make services available globally for debugging if needed
window.services = {
  auth: AuthService,
  provider: ProviderService
};

// Create our service exports
export {
  AuthService,
  ProviderService,
  setupAxios
};

// The most important part - render your app!
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you're using Create React App's performance measurement
// If you don't have this function, you can safely remove this line
if (typeof reportWebVitals === 'function') {
  reportWebVitals();
}