import express from 'express';
import { validateScheduleTemplate } from '../utils/schedulingUtils';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const templates = await req.db.ScheduleTemplate.findAll({
      where: { departmentId: req.query.department },
      include: [{
        model: req.db.ShiftTemplate,
        as: 'shifts'
      }]
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

router.post('/', async (req, res) => {
  try {
    const validation = validateScheduleTemplate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const template = await req.db.ScheduleTemplate.create({
      ...req.body,
      createdBy: req.user.id,
      departmentId: req.query.department
    }, {
      include: [{
        model: req.db.ShiftTemplate,
        as: 'shifts'
      }]
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Template creation failed' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const validation = validateScheduleTemplate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const [updated] = await req.db.ScheduleTemplate.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Template update failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.db.ScheduleTemplate.destroy({
      where: { id: req.params.id }
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Template deletion failed' });
  }
});

export default router;