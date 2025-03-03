/**
 * HealthcareSync Platform - Main Server
 * 
 * This is the main entry point for the HealthcareSync platform.
 * It sets up Express.js, Socket.io, authentication, and all the necessary middleware
 * for a comprehensive healthcare platform with HIPAA compliance.
 */

// Import required packages
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const LabResult = require('./models/LabResult');
const MedicalRecord = require('./models/MedicalRecord');
const HealthMetric = require('./models/HealthMetric');
const Billing = require('./models/Billing');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const EmergencyAlert = require('./models/EmergencyAlert');
const TelemedicineSession = require('./models/TelemedicineSession');
const DeviceIntegration = require('./models/DeviceIntegration');
const Imaging = require('./models/Imaging');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const labResultRoutes = require('./routes/labResults');
const medicalRecordRoutes = require('./routes/medicalRecords');
const healthMetricRoutes = require('./routes/healthMetrics');
const billingRoutes = require('./routes/billing');
const messageRoutes = require('./routes/messages');
const staffRoutes = require('./routes/staff');
const telemedicineRoutes = require('./routes/telemedicine');
const analyticsRoutes = require('./routes/analytics');
const deviceRoutes = require('./routes/devices');
const emergencyRoutes = require('./routes/emergency');
const imagingRoutes = require('./routes/imaging');

// Import middleware
const { authenticateJWT, requireAuth, requireRole } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/auditLogger');
const { hipaaCompliance } = require('./middleware/hipaaCompliance');

// Import services
const NotificationService = require('./services/NotificationService');
const TelemedicineService = require('./services/TelemedicineService');
const EmergencyService = require('./services/EmergencyService');
const AnalyticsService = require('./services/AnalyticsService');
const SchedulingService = require('./services/SchedulingService');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
  .then(() => logger.info('MongoDB connected'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_TIMEOUT) || 900000 // 15 minutes default
  }
});

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Use session middleware with Socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

// Socket.io authentication middleware
io.use((socket, next) => {
  if (socket.request.user) {
    next();
  } else {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.request.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  }
});

// Set up middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per window default
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// HIPAA compliance middleware
app.use(hipaaCompliance);

// Audit logging middleware
app.use(auditLogger);

// JWT authentication middleware
app.use(authenticateJWT);

// Configure passport local strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, { message: 'Incorrect email or password' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect email or password' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Configure passport JWT strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.id);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Set up API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', requireAuth, patientRoutes);
app.use('/api/appointments', requireAuth, appointmentRoutes);
app.use('/api/prescriptions', requireAuth, prescriptionRoutes);
app.use('/api/lab-results', requireAuth, labResultRoutes);
app.use('/api/medical-records', requireAuth, medicalRecordRoutes);
app.use('/api/health-metrics', requireAuth, healthMetricRoutes);
app.use('/api/billing', requireAuth, billingRoutes);
app.use('/api/messages', requireAuth, messageRoutes);
app.use('/api/staff', requireAuth, requireRole(['admin', 'doctor', 'nurse']), staffRoutes);
app.use('/api/telemedicine', requireAuth, telemedicineRoutes);
app.use('/api/analytics', requireAuth, requireRole(['admin', 'doctor', 'manager']), analyticsRoutes);
app.use('/api/devices', requireAuth, deviceRoutes);
app.use('/api/emergency', requireAuth, emergencyRoutes);
app.use('/api/imaging', requireAuth, imagingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Global error handler
app.use(errorHandler);

// Socket.io event handlers
io.on('connection', (socket) => {
  const userId = socket.request.user.id;
  logger.info(`User connected to socket: ${userId}`);
  
  // Add user to notification service
  NotificationService.addClient(userId, socket);
  
  // Handle appointment events
  socket.on('join_appointment', (appointmentId) => {
    socket.join(`appointment:${appointmentId}`);
    logger.info(`User ${userId} joined appointment room: ${appointmentId}`);
  });
  
  // Handle telemedicine events
  socket.on('join_telemedicine', (sessionId) => {
    socket.join(`telemedicine:${sessionId}`);
    logger.info(`User ${userId} joined telemedicine session: ${sessionId}`);
    TelemedicineService.joinSession(sessionId, userId, socket);
  });
  
  // Handle telemedicine signals
  socket.on('telemedicine_signal', (data) => {
    socket.to(`telemedicine:${data.sessionId}`).emit('telemedicine_signal', data);
  });
  
  // Handle emergency alerts
  socket.on('emergency_alert', async (data) => {
    try {
      const alert = await EmergencyService.createAlert({
        patient: data.patientId,
        message: data.message,
        location: data.location,
        severity: data.severity
      });
      
      // Broadcast to all staff
      io.to('role:doctor').to('role:nurse').to('role:admin').emit('emergency_alert', alert);
      logger.info(`Emergency alert created by user ${userId}: ${data.message}`);
    } catch (err) {
      logger.error('Error creating emergency alert:', err);
      socket.emit('error', { message: 'Failed to create emergency alert' });
    }
  });
  
  // Handle messaging
  socket.on('send_message', async (data) => {
    try {
      const message = await Message.create({
        sender: userId,
        recipient: data.recipientId,
        content: data.content,
        attachments: data.attachments
      });
      
      // Send to recipient if online
      io.to(`user:${data.recipientId}`).emit('new_message', message);
      
      // Send confirmation to sender
      socket.emit('message_sent', { success: true, messageId: message._id });
      
      logger.info(`Message sent from ${userId} to ${data.recipientId}`);
    } catch (err) {
      logger.error('Error sending message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle device data
  socket.on('device_data', async (data) => {
    try {
      const healthMetric = await HealthMetric.create({
        patient: userId,
        type: data.type,
        value: data.value,
        unit: data.unit,
        device: data.deviceId,
        timestamp: new Date()
      });
      
      // Analyze for critical values
      const isAbnormal = await AnalyticsService.analyzeHealthMetric(healthMetric);
      if (isAbnormal) {
        // Alert patient and healthcare providers
        socket.emit('abnormal_reading', healthMetric);
        
        // Find patient's doctors
        const patient = await Patient.findOne({ user: userId }).populate('primaryCareProvider');
        if (patient && patient.primaryCareProvider) {
          io.to(`user:${patient.primaryCareProvider._id}`).emit('patient_abnormal_reading', {
            patient: patient._id,
            healthMetric
          });
        }
      }
      
      logger.info(`Device data received from user ${userId}: ${data.type} - ${data.value}${data.unit}`);
    } catch (err) {
      logger.error('Error processing device data:', err);
      socket.emit('error', { message: 'Failed to process device data' });
    }
  });
  
  // Handle appointment reminders
  socket.on('check_appointments', async () => {
    try {
      const upcomingAppointments = await SchedulingService.getUpcomingAppointments(userId);
      socket.emit('appointment_reminders', upcomingAppointments);
    } catch (err) {
      logger.error('Error checking appointments:', err);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    NotificationService.removeClient(userId);
    logger.info(`User disconnected from socket: ${userId}`);
  });

  // Add WebSocket endpoint for consultation updates
  socket.on('consultation_update', async (data) => {
    try {
      // Validate input data
      if (!data.consultationId || !data.update) {
        return socket.emit('error', { message: 'Invalid consultation update data' });
      }

      // Process consultation update
      const updateResult = await TelemedicineService.updateConsultation(data.consultationId, data.update);
      if (updateResult) {
        // Notify all participants in the consultation
        io.to(`consultation:${data.consultationId}`).emit('consultation_update', data.update);
        logger.info(`Consultation update for ${data.consultationId} by user ${userId}`);
      } else {
        socket.emit('error', { message: 'Failed to update consultation' });
      }
    } catch (err) {
      logger.error('Error updating consultation:', err);
      socket.emit('error', { message: 'Failed to update consultation' });
    }
  });
});

// Add users to role-based rooms
io.of('/').adapter.on('create-room', (room) => {
  if (room.startsWith('role:')) {
    logger.info(`Role room created: ${room}`);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Don't crash the server in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Always crash on uncaught exceptions as the state is now uncertain
  process.exit(1);
});

// Ensure HIPAA compliance logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    auditLogger(req, res, next);
  } else {
    next();
  }
});

module.exports = { app, server, io }; 