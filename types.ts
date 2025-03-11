export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  description: string;
  startTime: Date;
  endTime: Date | null; // null if timer is currently running
  duration: number; // stored in seconds
  billable: boolean;
  invoiceId: string | null; // reference to invoice if this entry has been billed
  createdAt: Date;
  updatedAt: Date;
  billableRate: number | null; // hourly rate if different from default project rate
  tags: string[]; // for categorizing time entries
  source: 'timer' | 'manual'; // how the entry was created
}

export interface TimeTrackingSettings {
  userId: string;
  defaultBillableRate: number;
  roundingInterval: number; // in minutes (e.g., 15 for rounding to nearest 15 min)
  autoStopTimerAfterInactivity: number; // in minutes, 0 for disabled
  reminderInterval: number; // in minutes, 0 for disabled
  workingHours: {
    [key: string]: { // day of week (0-6)
      start: string; // HH:MM format
      end: string; // HH:MM format
      isWorkDay: boolean;
    }
  };
}

export interface BillableRate {
  id: string;
  projectId: string | null; // null for user default rate
  userId: string | null; // null for project default rate
  taskTypeId: string | null; // optional - different rates for different task types
  hourlyRate: number;
  currency: string;
  effectiveFrom: Date;
  effectiveTo: Date | null; // null for currently active rate
}

export interface TimeTrackingSummary {
  userId: string;
  projectId: string | null; // null for all projects
  taskId: string | null; // null for all tasks
  periodStart: Date;
  periodEnd: Date;
  totalDuration: number; // in seconds
  billableDuration: number; // in seconds
  nonBillableDuration: number; // in seconds
  billableAmount: number; // calculated amount
  currency: string;
  entries: TimeEntry[];
} 