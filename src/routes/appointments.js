import { Router } from 'express';
import { Appointment } from '../models';
import { sequelize } from '../database';
import { validateUserRole } from '../middleware/auth';

const router = Router();

// Create new appointment
router.post('/', validateUserRole('scheduler'), async (req, res) => {
  try {
    const appointment = await Appointment.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create appointment' });
  }
});

// Get appointments with filters
router.get('/', validateUserRole('staff'), async (req, res) => {
  try {
    const { patientId, clinicianId, startDate, endDate } = req.query;
    
    const where = {
      ...(patientId && { patientId }),
      ...(clinicianId && { clinicianId }),
      dateTime: {
        [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    const appointments = await Appointment.findAll({
      where,
      order: [['dateTime', 'ASC']],
      include: ['patient', 'clinician']
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment details
router.put('/:appointmentId', validateUserRole('scheduler'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const [updated] = await Appointment.update(req.body, {
      where: { appointmentId: req.params.appointmentId },
      transaction: t
    });
    
    await t.commit();
    updated ? res.json({ success: true }) : res.status(404).json({ error: 'Appointment not found' });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: 'Update failed' });
  }
});

// Cancel appointment
router.patch('/:appointmentId/cancel', validateUserRole('scheduler'), async (req, res) => {
  try {
    await Appointment.update(
      { status: 'canceled' },
      { where: { appointmentId: req.params.appointmentId } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Cancelation failed' });
  }
});

// Check clinician availability
router.get('/availability/:clinicianId', validateUserRole('staff'), async (req, res) => {
  try {
    const existingAppointments = await Appointment.findAll({
      where: {
        clinicianId: req.params.clinicianId,
        status: 'scheduled'
      },
      attributes: ['dateTime', 'duration']
    });

    res.json(existingAppointments);
  } catch (error) {
    res.status(500).json({ error: 'Availability check failed' });
  }
});

export default router;