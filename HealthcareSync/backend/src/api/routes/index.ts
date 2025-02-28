import express from 'express';
import authRoutes from './auth';
import patientsRoutes from './patients';
import appointmentsRoutes from './appointments';
import claimsRoutes from './claims';
import healthMetricsRoutes from './health-metrics';
import medicalRecordsRoutes from './medical-records';
import { errorHandler, notFoundHandler } from '../../middleware/error-handler';
import { requireAuth } from '../../middleware/auth';

const router = express.Router();

// Health check endpoint - no auth required
router.get('/health', async (req, res) => {
  try {
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes - Protected routes use requireAuth middleware
router.use('/auth', authRoutes);
router.use('/patients', requireAuth, patientsRoutes);
router.use('/appointments', requireAuth, appointmentsRoutes);
router.use('/claims', requireAuth, claimsRoutes);
router.use('/health-metrics', requireAuth, healthMetricsRoutes);
router.use('/medical-records', requireAuth, medicalRecordsRoutes);

// Handle 404 errors
router.use(notFoundHandler);

// Global error handler - must be last
router.use(errorHandler);

export default router;