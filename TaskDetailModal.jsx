import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiCalendar, 
  FiClock, 
  FiFlag, 
  FiUser, 
  FiTag, 
  FiCheckSquare,
  FiBarChart2,
  FiPlay,
  FiPause,
  FiPlusCircle,
  FiEdit,
  FiTrash
} from 'react-icons/fi';
import TaskTimeTracker from './TaskTimeTracker';

// Priority colors and labels
const priorityConfig = {
  low: { color: 'bg-green-500', label: 'Low' },
  medium: { color: 'bg-amber-500', label: 'Medium' },
  high: { color: 'bg-red-500', label: 'High' }
};

// Tag colors
const tagColors = {
  frontend: 'bg-blue-100 text-blue-800',
  backend: 'bg-green-100 text-green-800',
  ui: 'bg-purple-100 text-purple-800',
  api: 'bg-amber-100 text-amber-800',
  documentation: 'bg-gray-100 text-gray-800',
  planning: 'bg-indigo-100 text-indigo-800',
  management: 'bg-pink-100 text-pink-800',
  design: 'bg-rose-100 text-rose-800',
  infrastructure: 'bg-teal-100 text-teal-800',
  setup: 'bg-cyan-100 text-cyan-800',
  security: 'bg-red-100 text-red-800',
  database: 'bg-emerald-100 text-emerald-800',
  auth: 'bg-orange-100 text-orange-800'
};

const TaskDetailModal = ({ task, onClose, onUpdate }) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [newSubtask, setNewSubtask] = useState('');
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState(null);
  
  // Time entry form state
  const [timeEntryDate, setTimeEntryDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  
  // Calculate subtask completion percentage
  const subtaskCount = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
  const subtaskPercentage = subtaskCount > 0 ? Math.round((completedSubtasks / subtaskCount) * 100) : 0;
  
  // Fetch time entries for this task
  useEffect(() => {
    const fetchTimeEntries = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/time/entries?taskId=${task.id}`);
        const data = await response.json();
        
        if (data && data.entries) {
          setTimeEntries(data.entries);
        }
      } catch (error) {
        console.error('Error fetching time entries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeEntries();
  }, [task.id]);
  
  // Add new subtask
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const updatedTask = {
      ...task,
      subtasks: [
        ...task.subtasks,
        {
          id: `subtask-${task.id}-${Date.now()}`,
          title: newSubtask,
          completed: false
        }
      ]
    };
    
    onUpdate(updatedTask);
    setNewSubtask('');
  };
  
  // Toggle subtask completion
  const toggleSubtask = (subtaskId) => {
    const updatedSubtasks = task.subtasks.map(subtask => 
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );
    
    const updatedTask = {
      ...task,
      subtasks: updatedSubtasks
    };
    
    onUpdate(updatedTask);
  };
  
  // Delete subtask
  const deleteSubtask = (subtaskId) => {
    const updatedSubtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
    
    const updatedTask = {
      ...task,
      subtasks: updatedSubtasks
    };
    
    onUpdate(updatedTask);
  };
  
  // Add manual time entry
  const handleAddTimeEntry = async (e) => {
    e.preventDefault();
    
    // Calculate start and end datetime
    const startDateTime = new Date(`${timeEntryDate}T${startTime}`);
    const endDateTime = new Date(`${timeEntryDate}T${endTime}`);
    
    // Calculate duration in seconds
    const durationSeconds = (endDateTime - startDateTime) / 1000;
    
    if (durationSeconds <= 0) {
      alert('End time must be after start time');
      return;
    }
    
    try {
      const timeEntryData = {
        taskId: task.id,
        projectId: task.projectId || 'default-project',
        description: description || `Work on: ${task.title}`,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: durationSeconds,
        billable: isBillable,
        tags: task.tags || []
      };
      
      if (editingTimeEntry) {
        // Update existing time entry
        await fetch(`/api/time/entries/${editingTimeEntry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(timeEntryData)
        });
      } else {
        // Create new time entry
        await fetch('/api/time/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(timeEntryData)
        });
      }
      
      // Refresh time entries
      const response = await fetch(`/api/time/entries?taskId=${task.id}`);
      const data = await response.json();
      
      if (data && data.entries) {
        setTimeEntries(data.entries);
      }
      
      // Reset form
      setShowTimeEntryForm(false);
      setEditingTimeEntry(null);
      setDescription('');
      setTimeEntryDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('17:00');
      setIsBillable(true);
      
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Failed to save time entry');
    }
  };
  
  // Edit time entry
  const handleEditTimeEntry = (entry) => {
    setEditingTimeEntry(entry);
    
    // Parse start and end times
    const startDate = new Date(entry.startTime);
    const endDate = new Date(entry.endTime);
    
    // Set form values
    setTimeEntryDate(startDate.toISOString().split('T')[0]);
    setStartTime(startDate.toTimeString().slice(0, 5));
    setEndTime(endDate.toTimeString().slice(0, 5));
    setDescription(entry.description || '');
    setIsBillable(entry.billable);
    
    // Show form
    setShowTimeEntryForm(true);
  };
  
  // Delete time entry
  const handleDeleteTimeEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;
    
    try {
      await fetch(`/api/time/entries/${entryId}`, {
        method: 'DELETE'
      });
      
      // Remove from state
      setTimeEntries(timeEntries.filter(entry => entry.id !== entryId));
      
    } catch (error) {
      console.error('Error deleting time entry:', error);
      alert('Failed to delete time entry');
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
  
  // Calculate total time spent
  const totalTimeSpent = timeEntries.reduce((total, entry) => total + entry.duration, 0);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 mr-3 rounded-full ${priorityConfig[task.priority].color}`}></span>
            <h2 className="text-xl font-semibold">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button 
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'details' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Task Details
            </button>
            <button 
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'time' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('time')}
            >
              Time Tracking
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">
                {formatTime(totalTimeSpent)}
              </span>
            </button>
          </div>
        </div>
        
        {/* Modal content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' ? (
            // Task details tab
            <div className="space-y-6">
              {/* Task metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {/* Due date */}
                  {task.dueDate && (
                    <div className="flex items-center mb-4">
                      <FiCalendar className="text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-500">Due date</div>
                        <div>{new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Priority */}
                  <div className="flex items-center mb-4">
                    <FiFlag className="text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Priority</div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium overflow-hidden mr-2">
                          {task.assignee.avatar ? (
                            <img 
                              src={task.assignee.avatar} 
                              alt={task.assignee.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            task.assignee.name.charAt(0)
                          )}
                        </div>
                        {task.assignee.name}
                      </div>
                    ) : (
                      <div className="text-gray-400">Unassigned</div>
                    )}
                  </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex items-start mb-4">
                    <FiTag className="text-gray-400 mt-1 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Tags</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.tags.length > 0 ? (
                          task.tags.map(tag => (
                            <span 
                              key={tag} 
                              className={`text-xs px-2 py-0.5 rounded-full ${tagColors[tag] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <div className="text-gray-400">No tags</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Task description */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  {task.description || <span className="text-gray-400">No description</span>}
                </div>
              </div>
              
              {/* Subtasks */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Subtasks</h3>
                  {subtaskCount > 0 && (
                    <span className="text-sm text-gray-500">
                      {completedSubtasks}/{subtaskCount} completed
                    </span>
                  )}
                </div>
                
                {/* Subtasks progress bar */}
                {subtaskCount > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${subtaskPercentage}%` }}
                    ></div>
                  </div>
                )}
                
                {/* Subtasks list */}
                <ul className="space-y-2 mb-4">
                  {task.subtasks.map(subtask => (
                    <li key={subtask.id} className="flex items-start group">
                      <button
                        className={`flex-shrink-0 w-5 h-5 mt-0.5 mr-3 border rounded ${
                          subtask.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}
                        onClick={() => toggleSubtask(subtask.id)}
                      ></button>
                      <span className={`flex-grow ${
                        subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'
                      }`}>
                        {subtask.title}
                      </span>
                      <button
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                        onClick={() => deleteSubtask(subtask.id)}
                      >
                        <FiTrash size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
                
                {/* Add subtask form */}
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Add a subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    className="flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={addSubtask}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Time Tracking Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Time Tracking</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <TaskTimeTracker 
                    taskId={task.id} 
                    projectId={task.projectId} 
                    taskTitle={task.title}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Time tracking tab
            <div className="space-y-6">
              {/* Time tracking header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Time Entries</h3>
                  <p className="text-sm text-gray-500">
                    Total time spent: {formatTime(totalTimeSpent)}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setEditingTimeEntry(null);
                    setShowTimeEntryForm(!showTimeEntryForm);
                    
                    // Reset form values
                    if (!showTimeEntryForm) {
                      setTimeEntryDate(new Date().toISOString().split('T')[0]);
                      setStartTime('09:00');
                      setEndTime('17:00');
                      setDescription('');
                      setIsBillable(true);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
                >
                  <FiPlusCircle size={14} className="mr-1" />
                  {showTimeEntryForm ? 'Cancel' : 'Log Time'}
                </button>
              </div>
              
              {/* Manual time entry form */}
              {showTimeEntryForm && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-3">
                    {editingTimeEntry ? 'Edit Time Entry' : 'Add Time Entry'}
                  </h4>
                  
                  <form onSubmit={handleAddTimeEntry} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="flex items-center">
                          <FiCalendar className="text-gray-400 mr-2" />
                          <input
                            type="date"
                            value={timeEntryDate}
                            onChange={(e) => setTimeEntryDate(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <div className="flex items-center">
                            <FiClock className="text-gray-400 mr-2" />
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              required
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                          <div className="flex items-center">
                            <FiClock className="text-gray-400 mr-2" />
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              required
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={`Work on: ${task.title}`}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="billable"
                        checked={isBillable}
                        onChange={(e) => setIsBillable(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="billable" className="ml-2 text-sm text-gray-700">
                        Billable
                      </label>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {editingTimeEntry ? 'Update Entry' : 'Save Entry'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Time entries list */}
              <div>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : timeEntries.length > 0 ? (
                  <div className="overflow-hidden border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Billable
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {timeEntries.map(entry => {
                          const startDate = new Date(entry.startTime);
                          const endDate = new Date(entry.endTime);
                          
                          return (
                            <tr key={entry.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {entry.description || <span className="text-gray-400">No description</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {formatTime(entry.duration)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {entry.billable ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    Billable
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                    Non-billable
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleEditTimeEntry(entry)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  <FiEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTimeEntry(entry.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <FiTrash size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <FiClock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by logging time for this task
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowTimeEntryForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiPlusCircle className="mr-2 -ml-1 h-5 w-5" />
                        Log Time
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Time summary chart */}
              {timeEntries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Time Summary</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    {/* Chart would be implemented here using a charting library */}
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <FiBarChart2 className="mr-2" />
                      Time tracking chart would be displayed here
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Modal footer */}
        <div className="border-t p-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal; 