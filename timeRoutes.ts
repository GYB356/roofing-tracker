import express from 'express';
import TimeEntryController from '../controllers/timeEntryController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';

const router = express.Router();
const timeEntryController = new TimeEntryController();

/**
 * @swagger
 * /api/time/timer/start:
 *   post:
 *     summary: Start a new timer
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *             properties:
 *               taskId:
 *                 type: string
 *               description:
 *                 type: string
 *               billable:
 *                 type: boolean
 *                 default: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Timer started successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/timer/start', authenticateJWT, timeEntryController.startTimer);

/**
 * @swagger
 * /api/time/timer/stop:
 *   post:
 *     summary: Stop an active timer
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timeEntryId
 *             properties:
 *               timeEntryId:
 *                 type: string
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Timer stopped successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/timer/stop', authenticateJWT, timeEntryController.stopTimer);

/**
 * @swagger
 * /api/time/timer/current:
 *   get:
 *     summary: Get current active timer if any
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the active timer or null
 *       401:
 *         description: Unauthorized
 */
router.get('/timer/current', authenticateJWT, timeEntryController.getCurrentTimer);

/**
 * @swagger
 * /api/time/entries:
 *   post:
 *     summary: Create a manual time entry
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - projectId
 *               - startTime
 *               - endTime
 *             properties:
 *               taskId:
 *                 type: string
 *               projectId:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *               billable:
 *                 type: boolean
 *                 default: true
 *               billableRate:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Entry created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/entries', authenticateJWT, timeEntryController.createManualEntry);

/**
 * @swagger
 * /api/time/entries:
 *   get:
 *     summary: Get time entries with filtering
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: billable
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of time entries
 *       401:
 *         description: Unauthorized
 */
router.get('/entries', authenticateJWT, timeEntryController.getUserTimeEntries);

/**
 * @swagger
 * /api/time/entries/{timeEntryId}:
 *   get:
 *     summary: Get a time entry by ID
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: timeEntryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Time entry details
 *       404:
 *         description: Time entry not found
 *       401:
 *         description: Unauthorized
 */
router.get('/entries/:timeEntryId', authenticateJWT, 
  async (req, res) => {
    try {
      // Get time entry by ID logic
      const timeEntryId = req.params.timeEntryId;
      const timeEntry = await timeEntryController.getTimeEntryById(req, res);
      res.status(200).json(timeEntry);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/time/entries/{timeEntryId}:
 *   put:
 *     summary: Update a time entry
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: timeEntryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               billable:
 *                 type: boolean
 *               billableRate:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Entry updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Time entry not found
 */
router.put('/entries/:timeEntryId', authenticateJWT, timeEntryController.updateTimeEntry);

/**
 * @swagger
 * /api/time/entries/{timeEntryId}:
 *   delete:
 *     summary: Delete a time entry
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: timeEntryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Entry deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Time entry not found
 */
router.delete('/entries/:timeEntryId', authenticateJWT, timeEntryController.deleteTimeEntry);

/**
 * @swagger
 * /api/time/summary:
 *   get:
 *     summary: Get time tracking summary
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         required: true
 *         schema:
 *           type: string
 *           enum: [day, week, month, project, task]
 *     responses:
 *       200:
 *         description: Time summary data
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.get('/summary', authenticateJWT, timeEntryController.getTimeSummary);

/**
 * @swagger
 * /api/time/settings:
 *   get:
 *     summary: Get user time tracking settings
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User time tracking settings
 *       401:
 *         description: Unauthorized
 */
router.get('/settings', authenticateJWT, timeEntryController.getUserSettings);

/**
 * @swagger
 * /api/time/settings:
 *   put:
 *     summary: Update user time tracking settings
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultBillableRate:
 *                 type: number
 *               roundingInterval:
 *                 type: integer
 *               autoStopTimerAfterInactivity:
 *                 type: integer
 *               reminderInterval:
 *                 type: integer
 *               workingHours:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.put('/settings', authenticateJWT, timeEntryController.updateUserSettings);

/**
 * @swagger
 * /api/time/rates:
 *   get:
 *     summary: Get billable rates
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of billable rates
 *       401:
 *         description: Unauthorized
 */
router.get('/rates', authenticateJWT, authorizeRole(['admin', 'manager']), 
  async (req, res) => {
    // Implementation for getting billable rates
    // This would be implemented in a rates controller
  }
);

/**
 * @swagger
 * /api/time/rates:
 *   post:
 *     summary: Create a new billable rate
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hourlyRate
 *               - effectiveFrom
 *             properties:
 *               projectId:
 *                 type: string
 *               userId:
 *                 type: string
 *               taskTypeId:
 *                 type: string
 *               hourlyRate:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *               effectiveTo:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Rate created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/rates', authenticateJWT, authorizeRole(['admin', 'manager']),
  async (req, res) => {
    // Implementation for creating billable rates
    // This would be implemented in a rates controller
  }
);

export default router; 