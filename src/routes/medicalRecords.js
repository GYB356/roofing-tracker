import { Router } from 'express';
import { MedicalRecord } from '../models';
import { sequelize } from '../database';
import { validateUserRole } from '../middleware/auth';

const router = Router();

// Create new medical record
router.post('/', validateUserRole(['clinician', 'scheduler']), async (req, res) => {
  try {
    const record = await MedicalRecord.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create medical record' });
  }
});

// Get records for patient
router.get('/patient/:patientId', validateUserRole('staff'), async (req, res) => {
  try {
    const records = await MedicalRecord.findAll({
      where: { patientId: req.params.patientId },
      order: [['date', 'DESC']]
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// Update record details
router.put('/:recordId', validateUserRole(['clinician', 'scheduler']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const existingRecord = await MedicalRecord.findByPk(req.params.recordId, { transaction: t });
    
    if (!existingRecord) {
      await t.rollback();
      return res.status(404).json({ error: 'Record not found' });
    }

    const newRecord = await MedicalRecord.create({
      ...existingRecord.toJSON(),
      ...req.body,
      previousVersion: existingRecord.recordId,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { transaction: t });

    await t.commit();
    res.json(newRecord);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: 'Update failed' });
  }
});

// Archive medical record
router.patch('/:recordId/archive', validateUserRole('admin'), async (req, res) => {
  try {
    await MedicalRecord.update(
      { status: 'archived' },
      { where: { recordId: req.params.recordId } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Archive failed' });
  }
});

// Add file attachment to record
router.post('/:recordId/attachments', validateUserRole(['clinician', 'scheduler']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const record = await MedicalRecord.findByPk(req.params.recordId, { transaction: t });
    
    const updatedAttachments = [
      ...(record.attachments || []),
      { ...req.body, uploadedAt: new Date() }
    ];

    await record.update({ attachments: updatedAttachments }, { transaction: t });
    await t.commit();
    res.json(record);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: 'Attachment upload failed' });
  }
});

export default router;