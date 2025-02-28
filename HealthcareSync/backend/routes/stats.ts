import { Router } from 'express';
import { CacheService } from '../lib/cache';
import { db } from '../db';
import { users, appointments } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Cache keys
const CACHE_KEYS = {
  adminStats: 'stats:admin',
  staffStats: (id: number) => `stats:staff:${id}`,
  patientStats: (id: number) => `stats:patient:${id}`,
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  adminStats: 300, // 5 minutes
  staffStats: 180, // 3 minutes
  patientStats: 300, // 5 minutes
};

// Admin stats endpoint with caching
router.get('/admin/stats', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const stats = await CacheService.getOrSet(
      CACHE_KEYS.adminStats,
      async () => {
        // Fetch fresh stats from database
        const totalPatients = await db.select().from(users).where(eq(users.role, 'patient'));
        const todayAppointments = await db.select().from(appointments)
          .where(eq(appointments.date, new Date().toISOString().split('T')[0]));

        // Return formatted stats
        return {
          totalPatients: totalPatients.length,
          todayAppointments: todayAppointments.length,
          pendingClaims: 15,
          criticalCases: 3,
          totalClaims: 150,
          approvedClaims: 120,
          rejectedClaims: 15,
          pendingReview: 15,
          recentActivity: [
            {
              type: 'appointment',
              description: 'New appointment scheduled',
              timestamp: new Date().toISOString()
            }
          ]
        };
      },
      CACHE_TTL.adminStats
    );

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Staff stats endpoint with caching
router.get('/staff/stats', async (req, res) => {
  if (!req.user || req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const stats = await CacheService.getOrSet(
      CACHE_KEYS.staffStats(req.user.id),
      async () => {
        // Fetch fresh stats for staff
        const todayAppointments = await db.select().from(appointments)
          .where(and(
            eq(appointments.providerId, req.user!.id),
            eq(appointments.date, new Date().toISOString().split('T')[0])
          ));

        return {
          todayAppointments: todayAppointments.length,
          checkedInPatients: 3,
          pendingActions: 2,
          upcomingAppointments: [
            {
              patientName: "John Doe",
              time: "10:00 AM",
              type: "Check-up",
              isUrgent: false
            },
            {
              patientName: "Jane Smith",
              time: "11:30 AM",
              type: "Follow-up",
              isUrgent: true
            }
          ]
        };
      },
      CACHE_TTL.staffStats
    );

    res.json(stats);
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Patient stats endpoint with caching
router.get('/patients/:id/stats', async (req, res) => {
  if (!req.user || (req.user.role !== 'patient' && req.user.id !== parseInt(req.params.id))) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const stats = await CacheService.getOrSet(
      CACHE_KEYS.patientStats(parseInt(req.params.id)),
      async () => {
        return {
          vitals: {
            bloodPressure: '120/80',
            heartRate: 75,
            temperature: 98.6,
          },
          appointments: [
            {
              date: '2024-03-01',
              provider: 'Dr. Smith',
              type: 'Check-up'
            }
          ],
          medications: [
            {
              name: 'Aspirin',
              dosage: '81mg',
              frequency: 'Daily'
            }
          ],
          recentActivities: [
            {
              type: 'Appointment',
              description: 'Annual check-up completed',
              date: '2024-02-20'
            }
          ]
        };
      },
      CACHE_TTL.patientStats
    );

    res.json(stats);
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Cache invalidation endpoint
router.post('/invalidate-cache', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { type, id } = req.body;

  try {
    switch (type) {
      case 'admin':
        await CacheService.delete(CACHE_KEYS.adminStats);
        break;
      case 'staff':
        await CacheService.delete(CACHE_KEYS.staffStats(id));
        break;
      case 'patient':
        await CacheService.delete(CACHE_KEYS.patientStats(id));
        break;
      default:
        return res.status(400).json({ message: 'Invalid cache type' });
    }

    res.json({ message: 'Cache invalidated successfully' });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ message: 'Error invalidating cache' });
  }
});

export default router;
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Minimal implementation - get basic stats
router.get('/', async (req, res) => {
  try {
    // Count patients
    const patientCount = await prisma.patient.count();
    
    // Count appointments
    const appointmentCount = await prisma.appointment.count();
    
    // Count today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointments = await prisma.appointment.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    // Count pending claims
    const pendingClaims = await prisma.claim.count({
      where: {
        status: 'pending'
      }
    });
    
    res.json({
      patientCount,
      appointmentCount,
      todayAppointments,
      pendingClaims
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
