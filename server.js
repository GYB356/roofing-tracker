const helmet = require('helmet');
const express = require('express');
const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Input validation middleware
const validateConsultationInput = (req, res, next) => {
  const { doctorId, scheduledTime, reason } = req.body;
  if (!doctorId || !scheduledTime || !reason) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  next();
};

// HIPAA compliance logging
app.use((req, res, next) => {
  console.log(`Accessed by user: ${req.user.id}, Endpoint: ${req.originalUrl}`);
  next();
});

// ... existing code ... 