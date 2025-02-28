console.log('Starting Healthcare Platform backend...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

import('./index.js').catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
