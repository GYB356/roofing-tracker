import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { 
  FiMoreVertical, 
  FiCalendar, 
  FiCheckSquare, 
  FiClock,
  FiEdit2,
  FiTrash2
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

const Task = ({ task, index, onEditTask, onDeleteTask }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Calculate subtask completion percentage
  const subtaskCount = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
  const subtaskPercentage = subtaskCount > 0 ? Math.round((completedSubtasks / subtaskCount) * 100) : 0;
  
  // Toggle task details
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  // Toggle dropdown menu
  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };
  
  // Edit task
  const handleEditTask = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onEditTask) onEditTask(task);
  };
  
  // Delete task
  const handleDeleteTask = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDeleteTask) onDeleteTask(task.id);
  };
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card bg-white rounded-lg shadow-sm border p-3 mb-3 ${
            snapshot.isDragging ? 'shadow-lg' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="task-priority">
              <span 
                className={`inline-block w-2 h-2 rounded-full ${priorityConfig[task.priority].color}`} 
                title={`Priority: ${priorityConfig[task.priority].label}`}
              ></span>
            </div>
            <div className="dropdown relative">
              <button 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                onClick={toggleMenu}
              >
                <FiMoreVertical size={16} />
              </button>
              
              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                  <div className="py-1">
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleEditTask}
                    >
                      <FiEdit2 className="mr-2" size={14} />
                      Edit Task
                    </button>
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={handleDeleteTask}
                    >
                      <FiTrash2 className="mr-2" size={14} />
                      Delete Task
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <h3 className="font-medium text-gray-900 my-1">{task.title}</h3>
          
          {/* Task tags */}
          {task.tags.length > 0 && (
            <div className="task-tags flex flex-wrap gap-1 my-2">
              {task.tags.map(tag => (
                <span 
                  key={tag} 
                  className={`text-xs px-2 py-0.5 rounded-full ${tagColors[tag] || 'bg-gray-100 text-gray-800'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Subtasks progress if any */}
          {subtaskCount > 0 && (
            <div className="subtasks-progress mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="flex items-center">
                  <FiCheckSquare size={12} className="mr-1" />
                  Subtasks
                </span>
                <span>{completedSubtasks}/{subtaskCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${subtaskPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Task details */}
          <div className="task-details mt-3 flex flex-wrap items-center text-xs text-gray-500">
            {task.dueDate && (
              <div className="mr-3 flex items-center">
                <FiCalendar size={12} className="mr-1" />
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
            
            {task.assignee && (
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium overflow-hidden mr-1">
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
                <span>{task.assignee.name}</span>
              </div>
            )}
          </div>
          
          {/* Time tracking component */}
          <TaskTimeTracker 
            taskId={task.id} 
            projectId={task.projectId} 
            taskTitle={task.title}
          />
          
          {/* Expand button to view description */}
          {task.description && (
            <button
              onClick={toggleDetails}
              className="w-full text-xs text-blue-600 mt-2 text-left hover:underline focus:outline-none"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}
          
          {/* Task description (collapsed by default) */}
          {showDetails && task.description && (
            <div className="task-description mt-2 text-sm text-gray-600 border-t pt-2">
              {task.description}
              
              {/* Subtasks details */}
              {subtaskCount > 0 && (
                <div className="subtasks-list mt-2">
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Subtasks:</h4>
                  <ul className="space-y-1">
                    {task.subtasks.map(subtask => (
                      <li key={subtask.id} className="flex items-start">
                        <span className={`inline-block w-3 h-3 mt-1 mr-2 border rounded ${
                          subtask.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}></span>
                        <span className={`text-xs ${
                          subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'
                        }`}>
                          {subtask.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Task; 