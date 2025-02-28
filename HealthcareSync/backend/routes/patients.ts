import { Router } from 'express';
import { PatientService } from '../services/patient';
import { requireAuth, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { validatePatientData } from '../middleware/validation';

const router = Router();

// Get all patients
router.get('/', requireAuth, async (req, res) => {
  try {
    const patients = await PatientService.getAllPatients();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Failed to fetch patients' });
  }
});

// Get a single patient by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const patient = await PatientService.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: 'Failed to fetch patient' });
  }
});

// Create a new patient
router.post('/', requireAuth, validatePatientData, auditLog('patient:create'), async (req, res) => {
  try {
    const patient = await PatientService.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ message: 'Failed to create patient' });
  }
});

// Update a patient
router.put('/:id', requireAuth, validatePatientData, auditLog('patient:update'), async (req, res) => {
  try {
    const patient = await PatientService.updatePatient(req.params.id, req.body);
    res.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ message: 'Failed to update patient' });
  }
});

// Delete a patient (admin only)
router.delete('/:id', requireAuth, requireRole(['ADMIN']), auditLog('patient:delete'), async (req, res) => {
  try {
    await PatientService.deletePatient(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ message: 'Failed to delete patient' });
  }
});

// Search patients
router.get('/search/:query', requireAuth, async (req, res) => {
  try {
    const patients = await PatientService.searchPatients(req.params.query);
    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ message: 'Failed to search patients' });
  }
});

export default router;
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        healthMetrics: true,
        medicalRecords: true
      }
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
});

// Create a new patient profile
router.post('/', async (req, res) => {
  try {
    const { userId, dateOfBirth, phone, address, insuranceInfo } = req.body;
    
    const existingPatient = await prisma.patient.findUnique({
      where: { userId }
    });
    
    if (existingPatient) {
      return res.status(400).json({ error: 'Patient profile already exists for this user' });
    }
    
    const patient = await prisma.patient.create({
      data: {
        userId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone,
        address,
        insuranceInfo
      }
    });
    
    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient profile' });
  }
});

// Update patient information
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dateOfBirth, phone, address, insuranceInfo, medicalHistory } = req.body;
    
    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        phone,
        address,
        insuranceInfo,
        medicalHistory
      }
    });
    
    res.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient information' });
  }
});

export default router;
