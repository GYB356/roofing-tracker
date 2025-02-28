
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Get all scheduled telemedicine sessions for a provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const sessions = await prisma.telemedSession.findMany({
      where: {
        providerId: providerId,
      },
      include: {
        patient: true,
      },
    });
    
    return res.json({ sessions });
  } catch (error) {
    console.error('Error fetching telemedicine sessions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch telemedicine sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new telemedicine session
router.post('/sessions', async (req, res) => {
  try {
    const { patientId, providerId, scheduledTime, reasonForVisit } = req.body;
    
    const session = await prisma.telemedSession.create({
      data: {
        patientId,
        providerId,
        scheduledTime: new Date(scheduledTime),
        reasonForVisit,
        status: 'SCHEDULED',
      },
    });
    
    return res.status(201).json({ session });
  } catch (error) {
    console.error('Error creating telemedicine session:', error);
    return res.status(500).json({ 
      error: 'Failed to create telemedicine session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
