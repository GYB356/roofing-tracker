import axios from 'axios';
import { BehaviorSubject } from 'rxjs';

// Types
export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  description: string;
  startTime: Date | string;
  endTime: Date | string | null;
  duration: number | null;
  billable: boolean;
  invoiceId: string | null;
  billableRate: number | null;
  tags: string[];
  source: 'timer' | 'manual';
}

interface TimerState {
  isRunning: boolean;
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  lastSyncTime: number;
}

export class TimerService {
  private timerInterval: NodeJS.Timeout | null = null;
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private autoStopAfterInactivity: number = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Observable state
  private timerSubject = new BehaviorSubject<TimerState>({
    isRunning: false,
    activeEntry: null,
    elapsedSeconds: 0,
    lastSyncTime: 0
  });
  
  public timerState$ = this.timerSubject.asObservable();
  
  constructor() {
    // Load user settings
    this.loadUserSettings();
    
    // Check for active timer on initialization
    this.checkForActiveTimer();
    
    // Listen for user activity to reset inactivity timer
    window.addEventListener('mousemove', this.resetInactivityTimer);
    window.addEventListener('keypress', this.resetInactivityTimer);
    window.addEventListener('click', this.resetInactivityTimer);
    
    // Sync timer periodically while app is running
    setInterval(this.syncTimer, 60000); // Sync every minute
  }
  
  // Reset inactivity timer
  private resetInactivityTimer = () => {
    this.lastActivityTime = Date.now();
    
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
    
    if (this.timerSubject.value.isRunning) {
      this.inactivityTimeout = setTimeout(() => {
        this.autoStopTimerDueToInactivity();
      }, this.autoStopAfterInactivity);
    }
  };
  
  // Auto-stop timer after period of inactivity
  private autoStopTimerDueToInactivity = async () => {
    const state = this.timerSubject.value;
    
    if (state.isRunning && state.activeEntry) {
      // Stop the timer due to inactivity
      try {
        await this.stopTimer(true);
        // Notify user
        this.showNotification('Timer stopped automatically', 'Your timer was stopped due to inactivity.');
      } catch (error) {
        console.error('Failed to auto-stop timer:', error);
      }
    }
  };
  
  // Load user settings
  private loadUserSettings = async () => {
    try {
      const response = await axios.get('/api/time/settings');
      const settings = response.data;
      
      // Update inactivity timeout setting
      if (settings.autoStopTimerAfterInactivity > 0) {
        this.autoStopAfterInactivity = settings.autoStopTimerAfterInactivity * 60 * 1000; // Convert minutes to ms
      }
    } catch (error) {
      console.error('Failed to load timer settings:', error);
    }
  };
  
  // Show browser notification
  private showNotification = (title: string, body: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  };
  
  // Check for active timer on initialization
  private checkForActiveTimer = async () => {
    try {
      const response = await axios.get('/api/time/timer/current');
      
      if (response.data) {
        const activeEntry = response.data;
        const startTime = new Date(activeEntry.startTime).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        
        // Update state with active timer
        this.timerSubject.next({
          isRunning: true,
          activeEntry,
          elapsedSeconds,
          lastSyncTime: now
        });
        
        // Start timer interval
        this.startTimerInterval();
        // Set inactivity timeout
        this.resetInactivityTimer();
      }
    } catch (error) {
      console.error('Failed to check for active timer:', error);
    }
  };
  
  // Start timer interval to update elapsed time
  private startTimerInterval = () => {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      const currentState = this.timerSubject.value;
      
      if (currentState.isRunning) {
        this.timerSubject.next({
          ...currentState,
          elapsedSeconds: currentState.elapsedSeconds + 1
        });
      }
    }, 1000);
  };
  
  // Stop timer interval
  private stopTimerInterval = () => {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  };
  
  // Sync timer with server
  private syncTimer = async () => {
    const state = this.timerSubject.value;
    
    if (state.isRunning) {
      try {
        const response = await axios.get('/api/time/timer/current');
        
        if (response.data) {
          const serverEntry = response.data;
          const startTime = new Date(serverEntry.startTime).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          
          // Update elapsed time from server to correct any drift
          this.timerSubject.next({
            ...state,
            activeEntry: serverEntry,
            elapsedSeconds,
            lastSyncTime: now
          });
        } else {
          // Timer was stopped on server but still running on client
          this.timerSubject.next({
            isRunning: false,
            activeEntry: null,
            elapsedSeconds: 0,
            lastSyncTime: now
          });
          
          this.stopTimerInterval();
        }
      } catch (error) {
        console.error('Failed to sync timer:', error);
      }
    }
  };
  
  // Start a new timer
  public startTimer = async (
    taskId: string,
    description: string = '',
    billable: boolean = true,
    tags: string[] = []
  ): Promise<TimeEntry> => {
    // First check if there's already a running timer
    const state = this.timerSubject.value;
    
    if (state.isRunning) {
      throw new Error('A timer is already running. Please stop it before starting a new one.');
    }
    
    try {
      const response = await axios.post('/api/time/timer/start', {
        taskId,
        description,
        billable,
        tags
      });
      
      const newEntry = response.data;
      
      // Update state
      this.timerSubject.next({
        isRunning: true,
        activeEntry: newEntry,
        elapsedSeconds: 0,
        lastSyncTime: Date.now()
      });
      
      // Start timer interval
      this.startTimerInterval();
      // Set inactivity timeout
      this.resetInactivityTimer();
      
      return newEntry;
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  };
  
  // Stop the current timer
  public stopTimer = async (dueToInactivity: boolean = false): Promise<TimeEntry> => {
    const state = this.timerSubject.value;
    
    if (!state.isRunning || !state.activeEntry) {
      throw new Error('No active timer to stop.');
    }
    
    try {
      const response = await axios.post('/api/time/timer/stop', {
        timeEntryId: state.activeEntry.id,
        endTime: new Date().toISOString()
      });
      
      const stoppedEntry = response.data;
      
      // Update state
      this.timerSubject.next({
        isRunning: false,
        activeEntry: null,
        elapsedSeconds: 0,
        lastSyncTime: Date.now()
      });
      
      // Stop timer interval
      this.stopTimerInterval();
      
      return stoppedEntry;
    } catch (error) {
      console.error('Failed to stop timer:', error);
      throw error;
    }
  };
  
  // Format time in HH:MM:SS format
  public formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format duration in a readable format (e.g., 3h 45m)
  public formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Clean up on service destroy
  public destroy = () => {
    // Clear intervals and timeouts
    this.stopTimerInterval();
    
    // Remove event listeners
    window.removeEventListener('mousemove', this.resetInactivityTimer);
    window.removeEventListener('keypress', this.resetInactivityTimer);
    window.removeEventListener('click', this.resetInactivityTimer);
  };
}

// Export a singleton instance
export const timerService = new TimerService(); 