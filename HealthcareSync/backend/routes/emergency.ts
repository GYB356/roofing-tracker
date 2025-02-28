import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';

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

    // In a real system, you would also trigger push notifications, SMS, etc.

    res.status(201).json({ 
      message: 'Emergency alerts created successfully',
      count: createdAlerts.length 
    });
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    res.status(500).json({ message: 'Failed to create emergency alert' });
  }
});

// Mark emergency alert as read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const updatedAlert = await prisma.notification.update({
      where: { 
        id,
        type: 'ALERT'
      },
      data: {
        read: true
      }
    });

    res.json(updatedAlert);
  } catch (error) {
    console.error('Error updating emergency alert:', error);
    res.status(500).json({ message: 'Failed to update emergency alert' });
  }
});

// Escalate an emergency alert
router.post('/:id/escalate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { escalationLevel, notes } = req.body;

    const alert = await prisma.notification.findUnique({
      where: { id }
    });

    if (!alert || alert.type !== 'ALERT') {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Update alert metadata with escalation info
    const metadata = {
      ...alert.metadata as object,
      escalated: true,
      escalationLevel,
      escalationNotes: notes,
      escalatedAt: new Date().toISOString(),
      escalatedBy: req.user.id
    };

    const updatedAlert = await prisma.notification.update({
      where: { id },
      data: {
        metadata
      }
    });

    // In a real system, trigger additional notifications based on escalation level

    res.json({
      message: 'Alert escalated successfully',
      alert: updatedAlert
    });
  } catch (error) {
    console.error('Error escalating emergency alert:', error);
    res.status(500).json({ message: 'Failed to escalate emergency alert' });
  }
});

export default router;