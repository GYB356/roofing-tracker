import React, { useState, useEffect } from 'react';
import { 
  FiClock, 
  FiPlay, 
  FiPause, 
  FiList, 
  FiBarChart2, 
  FiCalendar 
} from 'react-icons/fi';
import { timerService } from '../services/timerService';

/**
 * Time tracking component for tasks
 * This component appears on task cards and task detail views
 * to allow time tracking directly from tasks
 */
const TaskTimeTracker = ({ taskId, projectId, taskTitle }) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTimeEntry, setActiveTimeEntry] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [recentEntries, setRecentEntries] = useState([]);
  
  // Subscribe to timer state
  useEffect(() => {
    const subscription = timerService.timerState$.subscribe(state => {
      setIsTimerRunning(state.isRunning);
      setActiveTimeEntry(state.activeEntry);
      setElapsedSeconds(state.elapsedSeconds);
      
      // Check if timer is running for this task
      const isActiveForThisTask = state.isRunning && 
        state.activeEntry && 
        state.activeEntry.taskId === taskId;
      
      setIsTimerRunning(isActiveForThisTask);
    });
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [taskId]);
  
  // Fetch total time spent on this task
  useEffect(() => {
    const fetchTimeData = async () => {
      try {
        // Get total time for this task
        const response = await fetch(`/api/time/task-summary?taskId=${taskId}`);
        const data = await response.json();
        
        if (data && data.totalDuration) {
          setTotalTimeSpent(data.totalDuration);
        }
        
        // Get recent time entries
        const entriesResponse = await fetch(`/api/time/entries?taskId=${taskId}&limit=3`);
        const entriesData = await entriesResponse.json();
        
        if (entriesData && entriesData.entries) {
          setRecentEntries(entriesData.entries);
        }
      } catch (error) {
        console.error('Error fetching time data:', error);
      }
    };
    
    fetchTimeData();
  }, [taskId, isTimerRunning]);
  
  // Start timer for this task
  const startTimer = async () => {
    try {
      await timerService.startTimer(
        taskId,
        `Working on: ${taskTitle}`,
        true, // billable
        [] // tags
      );
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };
  
  // Stop timer
  const stopTimer = async () => {
    try {
      await timerService.stopTimer();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };
  
  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Format datetime
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="task-time-tracker">
      {/* Timer controls */}
      <div className="flex items-center justify-between p-2 border-t mt-2 pt-2">
        <div className="flex items-center text-gray-600 text-xs">
          <FiClock className="mr-1" size={12} />
          <span title="Total time spent on this task">
            {formatTime(totalTimeSpent)}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {isTimerRunning ? (
            <button
              onClick={stopTimer}
              className="flex items-center text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              title="Stop timer"
            >
              <FiPause className="mr-1" size={12} />
              {formatTime(elapsedSeconds)}
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="flex items-center text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              title="Start timer"
            >
              <FiPlay className="mr-1" size={12} />
              Start
            </button>
          )}
          
          <button 
            className="flex items-center text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            title="View time entries"
            onClick={() => window.location.href = `/time-entries?taskId=${taskId}`}
          >
            <FiList className="mr-1" size={12} />
          </button>
        </div>
      </div>
      
      {/* Recent time entries - shown in expanded view only */}
      {recentEntries.length > 0 && (
        <div className="recent-entries mt-2 border-t pt-2">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Recent time entries:</h4>
          <ul className="text-xs text-gray-600">
            {recentEntries.map(entry => (
              <li key={entry.id} className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <FiCalendar size={10} className="mr-1" />
                  <span>{formatDateTime(entry.startTime)}</span>
                </div>
                <span>{formatTime(entry.duration)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskTimeTracker; 