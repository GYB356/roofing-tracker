import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { EmergencyService, AlertThreshold } from '../services/emergency-service';

const router = express.Router();

// Get all emergency alerts
router.get('/', requireAuth, async (req, res) => {
  try {
    const alerts = await prisma.notification.findMany({
      where: {
        type: 'ALERT',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching emergency alerts:', error);
    res.status(500).json({ message: 'Failed to fetch emergency alerts' });
  }
});

// Create a new emergency alert
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, message, recipientIds, priority, location } = req.body;

    if (!title || !message || !recipientIds || !Array.isArray(recipientIds)) {
      return res.status(400).json({ message: 'Invalid alert data' });
    }

    // Create alerts for each recipient
    const createdAlerts = await Promise.all(
      recipientIds.map(async (userId) => {
        return prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: 'ALERT',
            read: false,
            metadata: {
              priority: priority || 'high',
              location: location || 'unknown',
              timestamp: new Date().toISOString(),
              createdBy: req.user.id,
            },
          },
        });
      })
    );

    res.json(createdAlerts);
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    res.status(500).json({ message: 'Failed to create emergency alert' });
  }
});

// Set vital sign thresholds for a patient
router.post('/thresholds/:patientId', requireAuth, async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const thresholds: AlertThreshold[] = req.body.thresholds;

    if (!Array.isArray(thresholds)) {
      return res.status(400).json({ message: 'Invalid thresholds data' });
    }

    EmergencyService.setVitalSignThresholds(patientId, thresholds);
    res.json({ message: 'Thresholds updated successfully' });
  } catch (error) {
    console.error('Error setting vital sign thresholds:', error);
    res.status(500).json({ message: 'Failed to set vital sign thresholds' });
  }
});

// Get vital sign thresholds for a patient
router.get('/thresholds/:patientId', requireAuth, async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const thresholds = EmergencyService.getVitalSignThresholds(patientId);
    res.json(thresholds);
  } catch (error) {
    console.error('Error getting vital sign thresholds:', error);
    res.status(500).json({ message: 'Failed to get vital sign thresholds' });
  }
});

// Monitor vital signs
router.post('/monitor', requireAuth, async (req, res) => {
  try {
    const vitalSign = req.body;
    await EmergencyService.monitorVitalSigns(vitalSign);
    res.json({ message: 'Vital signs monitored successfully' });
  } catch (error) {
    console.error('Error monitoring vital signs:', error);
    res.status(500).json({ message: 'Failed to monitor vital signs' });
  }
});

export default router;