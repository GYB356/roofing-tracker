
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Get patient monitoring data
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Get patient's latest health metrics
    const healthMetrics = await prisma.healthMetric.findMany({
      where: {
        patientId: patientId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });
    
    return res.json({ healthMetrics });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch monitoring data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Set up alert thresholds for a patient
router.post('/alerts/config/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { metricType, minThreshold, maxThreshold } = req.body;
    
    // Create or update alert configuration
    const alertConfig = await prisma.alertConfiguration.upsert({
      where: {
        patientId_metricType: {
          patientId: patientId,
          metricType: metricType,
        },
      },
      update: {
        minThreshold,
        maxThreshold,
      },
      create: {
        patientId: patientId,
        metricType: metricType,
        minThreshold,
        maxThreshold,
      },
    });
    
    return res.json({ alertConfig });
  } catch (error) {
    console.error('Error configuring alerts:', error);
    return res.status(500).json({ 
      error: 'Failed to configure alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
