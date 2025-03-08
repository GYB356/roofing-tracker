// Export all services from a single entry point for easier importing
import authService from './services/AuthService';
import providerService from './services/ProviderService';
import setupAxios from './services/api.config';

// Initialize global API configuration
setupAxios();

export {
  authService,
  providerService,
  setupAxios
};

// Fix anonymous default export
const serviceExports = {
  auth: authService,
  provider: providerService
};

export default serviceExports;