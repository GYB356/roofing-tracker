import { Request, Response } from 'express';
import { TimeEntry, TimeTrackingSummary } from '../models/types';
import TimeEntryService from '../services/timeEntryService';
import { authorizeUser } from '../middleware/auth';

export default class TimeEntryController {
  private timeEntryService: TimeEntryService;

  constructor() {
    this.timeEntryService = new TimeEntryService();
  }

  // Start a new timer
  public startTimer = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { taskId, description, billable, tags } = req.body;

      const timeEntry = await this.timeEntryService.startTimer(
        userId,
        taskId,
        description,
        billable,
        tags
      );

      res.status(201).json(timeEntry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Stop an active timer
  public stopTimer = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { timeEntryId, endTime } = req.body;

      const timeEntry = await this.timeEntryService.stopTimer(
        userId,
        timeEntryId,
        endTime || new Date()
      );

      res.status(200).json(timeEntry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Create a manual time entry
  public createManualEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { 
        taskId, 
        projectId,
        description, 
        startTime, 
        endTime, 
        duration,
        billable, 
        billableRate,
        tags 
      } = req.body;

      const timeEntry = await this.timeEntryService.createManualEntry(
        userId,
        taskId,
        projectId,
        description,
        new Date(startTime),
        new Date(endTime),
        duration,
        billable,
        billableRate,
        tags
      );

      res.status(201).json(timeEntry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Update an existing time entry
  public updateTimeEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { timeEntryId } = req.params;
      const updateData = req.body;

      const timeEntry = await this.timeEntryService.updateTimeEntry(
        userId,
        timeEntryId,
        updateData
      );

      res.status(200).json(timeEntry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Delete a time entry
  public deleteTimeEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { timeEntryId } = req.params;

      await this.timeEntryService.deleteTimeEntry(userId, timeEntryId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get time entries for a user
  public getUserTimeEntries = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { 
        projectId, 
        taskId, 
        startDate, 
        endDate, 
        billable,
        page = 1,
        limit = 20
      } = req.query;

      const timeEntries = await this.timeEntryService.getUserTimeEntries(
        userId,
        {
          projectId: projectId as string,
          taskId: taskId as string,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          billable: billable === 'true',
          page: Number(page),
          limit: Number(limit)
        }
      );

      res.status(200).json(timeEntries);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get time tracking summary
  public getTimeSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { 
        projectId, 
        taskId, 
        startDate, 
        endDate, 
        groupBy 
      } = req.query;

      const summary = await this.timeEntryService.getTimeSummary(
        userId,
        {
          projectId: projectId as string,
          taskId: taskId as string,
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
          groupBy: groupBy as 'day' | 'week' | 'month' | 'project' | 'task'
        }
      );

      res.status(200).json(summary);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get current running timer if any
  public getCurrentTimer = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const activeTimer = await this.timeEntryService.getCurrentTimer(userId);
      
      res.status(200).json(activeTimer || null);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get user time tracking settings
  public getUserSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const settings = await this.timeEntryService.getUserSettings(userId);
      
      res.status(200).json(settings);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Update user time tracking settings
  public updateUserSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const settings = req.body;
      
      const updatedSettings = await this.timeEntryService.updateUserSettings(userId, settings);
      res.status(200).json(updatedSettings);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
} 