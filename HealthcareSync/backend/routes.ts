import express from 'express';
import authRoutes from './routes/auth';
import patientsRoutes from './routes/patients';
import appointmentsRoutes from './routes/appointments';
import claimsRoutes from './routes/claims';
import subscriptionsRoutes from './routes/subscriptions';
import healthMetricsRoutes from './routes/health-metrics';
import medicalRecordsRoutes from './routes/medical-records';
import aiHealthRoutes from './routes/health-predictions';
import statsRoutes from './routes/stats';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { prisma } from '../lib/prisma';
import { requireAuth } from './middleware/auth'; 
import monitoringRoutes from './routes/monitoring'; 
import telemedicineRoutes from './routes/telemedicine'; 
import emergencyRoutes from './routes/emergency'; 
import messagingRoutes from './routes/messaging'; 
import imagingRoutes from './routes/imaging';
import prescriptionRoutes from './routes/prescriptions';


const router = express.Router();

// Health check endpoint - no auth required
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
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

// API routes -  Protected routes now use requireAuth middleware
router.use('/auth', authRoutes); 
router.use('/patients', requireAuth, patientsRoutes); 
router.use('/appointments', requireAuth, appointmentsRoutes); 
router.use('/claims', requireAuth, claimsRoutes); 
router.use('/subscriptions', requireAuth, subscriptionsRoutes); 
router.use('/health-metrics', requireAuth, healthMetricsRoutes); 
router.use('/medical-records', requireAuth, medicalRecordsRoutes); 
router.use('/ai-health', requireAuth, aiHealthRoutes); 
router.use('/stats', requireAuth, statsRoutes); 
router.use('/monitoring', requireAuth, monitoringRoutes); 
router.use('/telemedicine', requireAuth, telemedicineRoutes); 
router.use('/emergency', requireAuth, emergencyRoutes); 
router.use('/messaging', requireAuth, messagingRoutes); 
router.use('/imaging', requireAuth, imagingRoutes);
router.use('/prescriptions', requireAuth, prescriptionRoutes);


// Handle 404 errors
router.use(notFoundHandler);

// Global error handler
router.use(errorHandler);

export default router;