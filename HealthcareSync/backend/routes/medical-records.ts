import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';

const router = Router();

// Validation schema for medical records
const medicalRecordSchema = z.object({
  patientId: z.string(),
  recordType: z.enum(['lab_result', 'prescription', 'diagnosis', 'imaging', 'vaccination', 'procedure']),
  title: z.string().min(1),
  description: z.string(),
  date: z.string().transform(str => new Date(str)),
  status: z.enum(['pending', 'final', 'amended']).default('final'),
  confidentiality: z.enum(['normal', 'restricted', 'very_restricted']).default('normal'),
  metadata: z.record(z.unknown()).optional(),
  attachmentUrl: z.string().optional()
});

// Get all medical records (with pagination)
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const records = await prisma.medicalRecord.findMany({
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            fullName: true
          }
        }
      }
    });

    const total = await prisma.medicalRecord.count();

    res.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// Get medical record by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Check if user has access to this record
    if (req.user?.role === 'patient' && record.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(record);
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({ error: 'Failed to fetch medical record' });
  }
});

// Create new medical record
router.post('/', 
  requireAuth, 
  requireRole(['doctor', 'staff']), 
  auditLog('medical-record:create'),
  async (req, res) => {
    try {
      const data = medicalRecordSchema.parse(req.body);

      const record = await prisma.medicalRecord.create({
        data: {
          ...data,
          doctorId: req.user!.id
        }
      });

      res.status(201).json(record);
    } catch (error) {
      console.error('Error creating medical record:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create medical record' });
    }
});

// Update medical record
router.patch('/:id', 
  requireAuth, 
  requireRole(['doctor', 'staff']), 
  auditLog('medical-record:update'),
  async (req, res) => {
    try {
      const data = medicalRecordSchema.partial().parse(req.body);

      const record = await prisma.medicalRecord.update({
        where: { id: req.params.id },
        data
      });

      res.json(record);
    } catch (error) {
      console.error('Error updating medical record:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to update medical record' });
    }
});

// Delete medical record
router.delete('/:id', 
  requireAuth, 
  requireRole(['doctor', 'staff', 'admin']), 
  auditLog('medical-record:delete'),
  async (req, res) => {
    try {
      await prisma.medicalRecord.delete({
        where: { id: req.params.id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting medical record:', error);
      res.status(500).json({ error: 'Failed to delete medical record' });
    }
});

// Get medical records by patient ID
router.get('/patient/:patientId', requireAuth, async (req, res) => {
  try {
    // Check if user has access to these records
    if (req.user?.role === 'patient' && req.user.id !== req.params.patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { date: 'desc' },
      include: {
        doctor: {
          select: {
            fullName: true
          }
        }
      }
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

export default router;
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Minimal implementation - get all medical records
router.get('/', async (req, res) => {
  try {
    const medicalRecords = await prisma.medicalRecord.findMany();
    res.json(medicalRecords);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

export default router;
