
import express from 'express';
import { requireAuth } from '../../middleware/auth';
import { AppointmentService } from '../../services/appointment-service';
import { validateAppointment } from '../../utils/validators';

const router = express.Router();

// Get all appointments
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const appointments = await AppointmentService.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

// Get appointment by ID
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const appointment = await AppointmentService.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// Create new appointment
router.post('/', requireAuth, validateAppointment, async (req, res, next) => {
  try {
    const appointment = await AppointmentService.createAppointment(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

// Update appointment
router.put('/:id', requireAuth, validateAppointment, async (req, res, next) => {
  try {
    const appointment = await AppointmentService.updateAppointment(req.params.id, req.body);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// Delete appointment
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await AppointmentService.deleteAppointment(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
