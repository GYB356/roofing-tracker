import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Get all prescriptions
router.get('/', requireAuth, async (req, res) => {
  try {
    const { patientId, status, from, to } = req.query;

    const whereClause: any = {};

    if (patientId) whereClause.patientId = patientId;
    if (status) whereClause.status = status;

    if (from || to) {
      whereClause.startDate = {};
      if (from) whereClause.startDate.gte = new Date(from as string);
      if (to) whereClause.startDate.lte = new Date(to as string);
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      orderBy: {
        startDate: 'desc'
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
});

// Get a specific prescription
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Failed to fetch prescription' });
  }
});

// Create a new prescription
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      medicationName,
      dosage,
      frequency,
      startDate,
      endDate,
      instructions,
      sideEffects
    } = req.body;

    if (!patientId || !doctorId || !medicationName || !dosage || !frequency || !startDate || !instructions) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify doctor authorization (assumes req.user.role check in middleware)
    if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only doctors can create prescriptions' });
    }

    // In a real system, check for drug interactions and allergies
    const drugInteractions = await checkDrugInteractions(patientId, medicationName);

    // If severe interactions found, alert the doctor
    if (drugInteractions.severity === 'severe') {
      return res.status(400).json({
        message: 'Severe drug interaction detected',
        interactions: drugInteractions.details
      });
    }

    // Create the prescription
    const newPrescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        medicationName,
        dosage,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'ACTIVE',
        instructions,
        sideEffects,
        refillCount: 0
      }
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: patientId,
        title: 'New Prescription',
        message: `Dr. ${req.user.name} has prescribed ${medicationName}`,
        type: 'PRESCRIPTION',
        read: false
      }
    });

    res.status(201).json(newPrescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Failed to create prescription' });
  }
});

// Request a prescription refill
router.post('/:id/refill', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id }
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check if prescription is eligible for refill
    if (prescription.status !== 'ACTIVE') {
      return res.status(400).json({
        message: 'This prescription cannot be refilled',
        reason: `Current status: ${prescription.status}`
      });
    }

    // Check if refill count is exhausted
    if (prescription.refillCount >= 3) {
      return res.status(400).json({
        message: 'Maximum refills reached',
        refillsUsed: prescription.refillCount
      });
    }

    // Update prescription status to pending refill
    const updatedPrescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: 'PENDING_REFILL'
      }
    });

    // Create notification for doctor
    await prisma.notification.create({
      data: {
        userId: prescription.doctorId,
        title: 'Refill Request',
        message: `Patient has requested a refill for ${prescription.medicationName}`,
        type: 'PRESCRIPTION',
        read: false,
        metadata: {
          prescriptionId: id,
          action: 'refill_request'
        }
      }
    });

    res.json({
      message: 'Refill request submitted',
      prescription: updatedPrescription
    });
  } catch (error) {
    console.error('Error requesting prescription refill:', error);
    res.status(500).json({ message: 'Failed to request prescription refill' });
  }
});

// Approve a refill request
router.post('/:id/approve-refill', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify doctor authorization
    if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only doctors can approve refills' });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id }
    });

    if (!prescription || prescription.status !== 'PENDING_REFILL') {
      return res.status(400).json({ message: 'No pending refill request found' });
    }

    // Approve refill
    const updatedPrescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        refillCount: {
          increment: 1
        }
      }
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: prescription.patientId,
        title: 'Refill Approved',
        message: `Your refill for ${prescription.medicationName} has been approved`,
        type: 'PRESCRIPTION',
        read: false
      }
    });

    res.json({
      message: 'Refill approved successfully',
      prescription: updatedPrescription
    });
  } catch (error) {
    console.error('Error approving refill:', error);
    res.status(500).json({ message: 'Failed to approve refill' });
  }
});

// Update a prescription
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, instructions, endDate } = req.body;

    // Verify doctor authorization
    if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only doctors can update prescriptions' });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id }
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Update the prescription
    const updatedPrescription = await prisma.prescription.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(instructions && { instructions }),
        ...(endDate && { endDate: new Date(endDate) })
      }
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Failed to update prescription' });
  }
});

// Mock function for drug interaction checking
async function checkDrugInteractions(patientId: string, medicationName: string) {
  // In a real system, this would query a drug interaction database
  // For now, we'll return mock data
  return {
    severity: 'mild',
    details: [
      {
        drugA: medicationName,
        drugB: 'Existing medication',
        severity: 'mild',
        description: 'May cause mild drowsiness'
      }
    ]
  };
}

export default router;