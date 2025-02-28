import { Router } from 'express';
import { AppointmentService } from '../services/appointment';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateAppointmentData } from '../middleware/validation';
import { auditLog } from '../middleware/audit';

const router = Router();

// Get all appointments
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let appointments;

    if (role === 'ADMIN') {
      // Admins can see all appointments
      appointments = await AppointmentService.getAllAppointments();
    } else if (role === 'DOCTOR') {
      // Doctors see their own appointments
      appointments = await AppointmentService.getDoctorAppointments(userId);
    } else {
      // Patients see their own appointments
      appointments = await AppointmentService.getPatientAppointments(userId);
    }

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

// Get appointment by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const appointment = await AppointmentService.getAppointmentById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Security check - users can only view their own appointments unless admin
    if (req.user.role !== 'ADMIN' && 
        appointment.doctorId !== req.user.id && 
        appointment.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this appointment' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to retrieve appointment' });
  }
});

// Create new appointment
router.post('/', requireAuth, validateAppointmentData, auditLog('appointment:create'), async (req, res) => {
  try {
    const { patientId, doctorId, date, time, duration, reason, status } = req.body;

    // Basic validation
    if (!patientId || !doctorId || !date || !time || !duration || !reason) {
      return res.status(400).json({ error: 'Missing required appointment information' });
    }

    // Check availability
    const isAvailable = await AppointmentService.checkAvailability(doctorId, date, time, duration);
    if (!isAvailable) {
      return res.status(409).json({ error: 'Doctor is not available at the requested time' });
    }

    const appointment = await AppointmentService.createAppointment({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
router.put('/:id', requireAuth, validateAppointmentData, auditLog('appointment:update'), async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await AppointmentService.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Security check - only admin, the doctor, or the patient can update
    if (req.user.role !== 'ADMIN' && 
        appointment.doctorId !== req.user.id && 
        appointment.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    // If date/time changed, check availability again
    if ((req.body.date && req.body.date !== appointment.date) || 
        (req.body.time && req.body.time !== appointment.time) ||
        (req.body.duration && req.body.duration !== appointment.duration)) {

      const isAvailable = await AppointmentService.checkAvailability(
        req.body.doctorId || appointment.doctorId,
        req.body.date || appointment.date,
        req.body.time || appointment.time,
        req.body.duration || appointment.duration,
        appointmentId // exclude current appointment from check
      );

      if (!isAvailable) {
        return res.status(409).json({ error: 'Doctor is not available at the requested time' });
      }
    }

    const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, {
      ...req.body,
      updatedBy: req.user.id
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Cancel appointment
router.patch('/:id/cancel', requireAuth, auditLog('appointment:cancel'), async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await AppointmentService.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Security check - only admin, the doctor, or the patient can cancel
    if (req.user.role !== 'ADMIN' && 
        appointment.doctorId !== req.user.id && 
        appointment.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    const canceledAppointment = await AppointmentService.cancelAppointment(appointmentId, {
      canceledBy: req.user.id,
      cancelReason: reason
    });

    res.json(canceledAppointment);
  } catch (error) {
    console.error('Error canceling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Get doctor's availability
router.get('/doctor/:doctorId/availability', requireAuth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const availability = await AppointmentService.getDoctorAvailability(doctorId, date as string);
    res.json(availability);
  } catch (error) {
    console.error('Error getting doctor availability:', error);
    res.status(500).json({ error: 'Failed to retrieve doctor availability' });
  }
});

export default router;
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const { doctorId, patientId, status, date } = req.query;
    
    const whereClause: any = {};
    
    if (doctorId) {
      whereClause.doctorId = doctorId as string;
    }
    
    if (patientId) {
      whereClause.patientId = patientId as string;
    }
    
    if (status) {
      whereClause.status = status as string;
    }
    
    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment details' });
  }
});

// Create a new appointment
router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, date, startTime, endTime, notes } = req.body;
    
    if (!patientId || !doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes
      }
    });
    
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update an appointment
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, status, notes } = req.body;
    
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        status,
        notes
      }
    });
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Cancel an appointment
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: cancellationReason ? 
          `Cancelled: ${cancellationReason}` :
          'Appointment cancelled'
      }
    });
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;
