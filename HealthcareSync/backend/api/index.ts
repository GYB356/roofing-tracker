
import express from 'express';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import appointmentRoutes from './routes/appointments';
import { errorHandler } from '../middleware/error-handler';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);

// Global error handler
router.use(errorHandler);

export default router;
