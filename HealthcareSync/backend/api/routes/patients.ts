
import express from 'express';
import { requireAuth } from '../../middleware/auth';
import { PatientService } from '../../services/patient-service';
import { validatePatient } from '../../utils/validators';

const router = express.Router();

// Get all patients
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const patients = await PatientService.getAllPatients();
    res.json(patients);
  } catch (error) {
    next(error);
  }
});

// Get patient by ID
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const patient = await PatientService.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    next(error);
  }
});

// Create new patient
router.post('/', requireAuth, validatePatient, async (req, res, next) => {
  try {
    const patient = await PatientService.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
});

// Update patient
router.put('/:id', requireAuth, validatePatient, async (req, res, next) => {
  try {
    const patient = await PatientService.updatePatient(req.params.id, req.body);
    res.json(patient);
  } catch (error) {
    next(error);
  }
});

// Delete patient
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await PatientService.deletePatient(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
import express from 'express';
import { PatientService } from '../../services/patient-service';
import { requireAuth, restrictTo } from '../../middleware/auth';

const router = express.Router();

// Get all patients - restricted to admin and doctor
router.get('/', requireAuth, restrictTo('ADMIN', 'DOCTOR'), async (req, res, next) => {
  try {
    const patients = await PatientService.getAllPatients();
    res.json(patients);
  } catch (error) {
    next(error);
  }
});

// Get patient by ID
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    // If not admin or doctor, can only view own profile
    if (req.user.role !== 'ADMIN' && req.user.role !== 'DOCTOR') {
      // Get patient by user ID
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      if (!patient || patient.id !== req.params.id) {
        return res.status(403).json({ message: 'You do not have permission to view this patient' });
      }
    }
    
    const patient = await PatientService.getPatientById(req.params.id);
    res.json(patient);
  } catch (error) {
    next(error);
  }
});

// Create a new patient - restricted to admin
router.post('/', requireAuth, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const patient = await PatientService.createPatient(req.body);
    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
});

// Update a patient
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    // If not admin or doctor, can only update own profile
    if (req.user.role !== 'ADMIN' && req.user.role !== 'DOCTOR') {
      // Get patient by user ID
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id }
      });
      
      if (!patient || patient.id !== req.params.id) {
        return res.status(403).json({ message: 'You do not have permission to update this patient' });
      }
    }
    
    const patient = await PatientService.updatePatient(req.params.id, req.body);
    res.json(patient);
  } catch (error) {
    next(error);
  }
});

// Delete a patient - restricted to admin
router.delete('/:id', requireAuth, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    await PatientService.deletePatient(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get patient health metrics
router.get('/:id/health-metrics', requireAuth, async (req, res, next) => {
  try {
    // If not admin or doctor, can only view own health metrics
    if (req.user.role !== 'ADMIN' && req.user.role !== 'DOCTOR') {
      // Get patient by user ID
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id }
      });
      
      if (!patient || patient.id !== req.params.id) {
        return res.status(403).json({ message: 'You do not have permission to view these health metrics' });
      }
    }
    
    const healthMetrics = await PatientService.getPatientHealthMetrics(req.params.id);
    res.json(healthMetrics);
  } catch (error) {
    next(error);
  }
});

// Get patient medical records
router.get('/:id/medical-records', requireAuth, async (req, res, next) => {
  try {
    // If not admin or doctor, can only view own medical records
    if (req.user.role !== 'ADMIN' && req.user.role !== 'DOCTOR') {
      // Get patient by user ID
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id }
      });
      
      if (!patient || patient.id !== req.params.id) {
        return res.status(403).json({ message: 'You do not have permission to view these medical records' });
      }
    }
    
    const medicalRecords = await PatientService.getPatientMedicalRecords(req.params.id);
    res.json(medicalRecords);
  } catch (error) {
    next(error);
  }
});

export default router;
