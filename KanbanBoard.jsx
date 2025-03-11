import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  FiPlus, FiEdit2, FiTrash2, FiMoreVertical, 
  FiCalendar, FiClock, FiFlag, FiUser, FiTag, FiCheckSquare,
  FiFilter, FiSearch, FiX
} from 'react-icons/fi';
import Column from './Column'; // Import your updated Column component
import Task from './Task'; // Import your updated Task component with time tracking
import TaskDetailModal from './TaskDetailModal'; // Import the modal component
import { timerService } from '../services/timerService'; // Import timer service

const initialBoardData = {
  tasks: {
    'task-1': { id: 'task-1', title: 'Task 1', description: 'Description for task 1', tags: ['tag1'], assignee: { id: 'user-1', name: 'User One' } },
    'task-2': { id: 'task-2', title: 'Task 2', description: 'Description for task 2', tags: ['tag2'], assignee: { id: 'user-2', name: 'User Two' } }
  },
  columns: {
    'column-1': { id: 'column-1', title: 'To Do', taskIds: ['task-1'] },
    'column-2': { id: 'column-2', title: 'In Progress', taskIds: ['task-2'] }
  },
  columnOrder: ['column-1', 'column-2']
};

const KanbanBoard = () => {
  const [boardData, setBoardData] = useState(initialBoardData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeTimers, setActiveTimers] = useState([]);
  
  // In a real app, you'd fetch this from an API
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBoardData(initialBoardData);
      setLoading(false);
    }, 500);
  }, []);
  
  // Subscribe to timer events
  useEffect(() => {
    const subscription = timerService.timerState$.subscribe(state => {
      if (state.isRunning && state.activeEntry) {
        setActiveTimers(prev => {
          // Check if this timer is already being tracked
          const existingIndex = prev.findIndex(
            timer => timer.taskId === state.activeEntry.taskId
          );
          
          if (existingIndex >= 0) {
            // Update existing timer
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              elapsedSeconds: state.elapsedSeconds
            };
            return updated;
          } else {
            // Add new timer
            return [...prev, {
              taskId: state.activeEntry.taskId,
              elapsedSeconds: state.elapsedSeconds
            }];
          }
        });
      } else {
        // Timer stopped, remove from active timers
        if (state.activeEntry) {
          setActiveTimers(prev => 
            prev.filter(timer => timer.taskId !== state.activeEntry.taskId)
          );
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Get all unique tags in the board
  const allTags = Object.values(boardData.tasks).reduce((tags, task) => {
    task.tags.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }, []).sort();
  
  // Get all assignees in the board
  const allAssignees = Object.values(boardData.tasks).reduce((assignees, task) => {
    if (task.assignee && !assignees.find(a => a.id === task.assignee.id)) {
      assignees.push(task.assignee);
    }
    return assignees;
  }, []).sort((a, b) => a.name.localeCompare(b.name));
  
  // Filter tasks based on search and filters
  const filteredTasks = { ...boardData.tasks };
  if (searchText || filterAssignee || filterTags.length > 0) {
    Object.keys(filteredTasks).forEach(taskId => {
      const task = filteredTasks[taskId];
      
      // Filter by search text
      const matchesSearch = searchText
        ? task.title.toLowerCase().includes(searchText.toLowerCase()) ||
          task.description.toLowerCase().includes(searchText.toLowerCase())
        : true;
      
      // Filter by assignee
      const matchesAssignee = filterAssignee
        ? task.assignee && task.assignee.id === filterAssignee
        : true;
      
      // Filter by tags
      const matchesTags = filterTags.length > 0
        ? filterTags.every(tag => task.tags.includes(tag))
        : true;
      
      // Remove tasks that don't match all filters
      if (!matchesSearch || !matchesAssignee || !matchesTags) {
        delete filteredTasks[taskId];
      }
    });
  }
  
  // Create filtered board data
  const filteredBoardData = {
    ...boardData,
    columns: Object.entries(boardData.columns).reduce((columns, [columnId, column]) => {
      columns[columnId] = {
        ...column,
        taskIds: column.taskIds.filter(taskId => filteredTasks[taskId])
      };
      return columns;
    }, {})
  };
  
  // Handle drag end
  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    
    // If there's no destination, do nothing
    if (!destination) return;
    
    // If the source and destination are the same, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // Handle column reordering
    if (type === 'column') {
      const newColumnOrder = Array.from(boardData.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);
      
      setBoardData({
        ...boardData,
        columnOrder: newColumnOrder
      });
      return;
    }
    
    // Handle task movement
    const startColumn = boardData.columns[source.droppableId];
    const endColumn = boardData.columns[destination.droppableId];
    
    // Moving within the same column
    if (startColumn === endColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      
      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds
      };
      
      setBoardData({
        ...boardData,
        columns: {
          ...boardData.columns,
          [newColumn.id]: newColumn
        }
      });
      return;
    }
    
    // Check if destination column has a limit
    if (endColumn.limit > 0 && endColumn.taskIds.length >= endColumn.limit) {
      // Show a message that the column limit has been reached
      setError(`Cannot move task to "${endColumn.title}" - column limit reached (${endColumn.limit})`);
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Moving from one column to another
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    
    const newStartColumn = {
      ...startColumn,
      taskIds: startTaskIds
    };
    
    const endTaskIds = Array.from(endColumn.taskIds);
    endTaskIds.splice(destination.index, 0, draggableId);
    
    const newEndColumn = {
      ...endColumn,
      taskIds: endTaskIds
    };
    
    setBoardData({
      ...boardData,
      columns: {
        ...boardData.columns,
        [newStartColumn.id]: newStartColumn,
        [newEndColumn.id]: newEndColumn
      }
    });
    
    // If task has active timer, keep it running but update task state
    const movedTask = boardData.tasks[draggableId];
    const isTimerRunning = activeTimers.some(timer => timer.taskId === draggableId);
    
    if (isTimerRunning) {
      // Notify user that timer is still running for moved task
      console.log(`Timer still running for task: ${movedTask.title}`);
      // You could show a toast notification here
    }
  };
  
  // Handle search input
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };
  
  // Handle assignee filter
  const handleAssigneeFilter = (assigneeId) => {
    setFilterAssignee(assigneeId === filterAssignee ? '' : assigneeId);
  };
  
  // Handle tag filter
  const handleTagFilter = (tag) => {
    setFilterTags(
      filterTags.includes(tag)
        ? filterTags.filter(t => t !== tag)
        : [...filterTags, tag]
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setFilterAssignee('');
    setFilterTags([]);
  };
  
  // Handle task click to open details modal
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };
  
  // Handle task update
  const handleTaskUpdate = (updatedTask) => {
    setBoardData({
      ...boardData,
      tasks: {
        ...boardData.tasks,
        [updatedTask.id]: updatedTask
      }
    });
  };
  
  // Handle task creation
  const handleAddTask = (columnId) => {
    // Implementation for adding a new task
    console.log(`Add task to column: ${columnId}`);
    // In a real app, you'd show a form and add the task to the board data
  };
  
  // Handle task deletion
  const handleDeleteTask = (taskId) => {
    // Check if task has active timer
    const hasActiveTimer = activeTimers.some(timer => timer.taskId === taskId);
    
    if (hasActiveTimer) {
      if (!confirm('This task has an active timer. Stopping timer and deleting task. Continue?')) {
        return;
      }
      
      // Stop timer for this task
      timerService.stopTimer();
    }
    
    // Remove task from board data
    const updatedTasks = { ...boardData.tasks };
    delete updatedTasks[taskId];
    
    // Remove task from all columns
    const updatedColumns = Object.entries(boardData.columns).reduce(
      (columns, [columnId, column]) => {
        columns[columnId] = {
          ...column,
          taskIds: column.taskIds.filter(id => id !== taskId)
        };
        return columns;
      },
      {}
    );
    
    setBoardData({
      ...boardData,
      tasks: updatedTasks,
      columns: updatedColumns
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="kanban-board p-4">
      {/* Board header */}
      <div className="board-header mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Project Board</h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchText}
                onChange={handleSearchChange}
                className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-md bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FiSearch className="h-5 w-5" />
              </div>
            </div>
            
            {/* Add task button */}
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <FiPlus className="mr-2" /> Add Task
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="filters mt-4 flex flex-wrap items-center gap-2">
          {/* Active timers indicator */}
          {activeTimers.length > 0 && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center text-sm mr-4">
              <FiClock className="mr-2" />
              <span>{activeTimers.length} active timer{activeTimers.length > 1 ? 's' : ''}</span>
            </div>
          )}
          
          {/* Assignee filter */}
          <div className="assignee-filter">
            <span className="text-sm text-gray-500 mr-2">Assignee:</span>
            <div className="flex flex-wrap gap-1">
              {allAssignees.map(assignee => (
                <button
                  key={assignee.id}
                  onClick={() => handleAssigneeFilter(assignee.id)}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    filterAssignee === assignee.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-xs overflow-hidden mr-1">
                    {assignee.avatar ? (
                      <img 
                        src={assignee.avatar} 
                        alt={assignee.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      assignee.name.charAt(0)
                    )}
                  </div>
                  {assignee.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tag filter */}
          <div className="tag-filter ml-4">
            <span className="text-sm text-gray-500 mr-2">Tags:</span>
            <div className="flex flex-wrap gap-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    filterTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : `${tagColors[tag] || 'bg-gray-100 text-gray-800'} hover:bg-opacity-80`
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* Clear filters */}
          {(searchText || filterAssignee || filterTags.length > 0) && (
            <button
              onClick={clearFilters}
              className="ml-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex h-full overflow-x-auto py-2 min-h-[calc(100vh-18rem)]"
            >
              {filteredBoardData.columnOrder.map((columnId, index) => {
                const column = filteredBoardData.columns[columnId];
                const columnTasks = column.taskIds.map(taskId => {
                  const task = boardData.tasks[taskId];
                  
                  // Add project ID to tasks if not present (for time tracking)
                  if (!task.projectId) {
                    task.projectId = 'default-project'; // Replace with actual project ID
                  }
                  
                  // Check if this task has an active timer
                  const timer = activeTimers.find(t => t.taskId === task.id);
                  const hasActiveTimer = !!timer;
                  
                  return {
                    ...task,
                    hasActiveTimer,
                    elapsedSeconds: timer ? timer.elapsedSeconds : 0
                  };
                });
                
                return (
                  <Draggable key={column.id} draggableId={column.id} index={index}>
                    {(provided) => (
                      <div
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        className="column-container flex flex-col h-full w-72 mx-2 rounded-lg shadow-sm overflow-hidden border"
                      >
                        {/* Column header */}
                        <div 
                          {...provided.dragHandleProps}
                          className={`p-3 ${columnColors[column.color].header} border-b flex justify-between items-center`}
                        >
                          <div className="flex items-center">
                            <h3 className="font-medium">{column.title}</h3>
                            <span className="ml-2 bg-white bg-opacity-80 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                              {columnTasks.length}{column.limit > 0 && ` / ${column.limit}`}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button 
                              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                              onClick={() => handleAddTask(column.id)}
                            >
                              <FiPlus size={16} />
                            </button>
                            <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                              <FiMoreVertical size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Task limit warning */}
                        {column.limit > 0 && columnTasks.length >= Math.floor(column.limit * 0.75) && (
                          <div className={`px-3 py-1 text-xs font-medium ${
                            columnTasks.length >= column.limit
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {columnTasks.length >= column.limit
                              ? `Column limit reached (${column.limit})` 
                              : `Column nearing limit (${columnTasks.length}/${column.limit})`
                            }
                          </div>
                        )}
                        
                        {/* Tasks container */}
                        <Droppable droppableId={column.id} type="task">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-grow p-2 overflow-y-auto ${columnColors[column.color].body} ${
                                snapshot.isDraggingOver ? 'bg-opacity-80' : ''
                              }`}
                            >
                              {columnTasks.map((task, index) => (
                                <Task 
                                  key={task.id} 
                                  task={task} 
                                  index={index}
                                  onClick={() => handleTaskClick(task)}
                                  onEditTask={handleTaskClick}
                                  onDeleteTask={handleDeleteTask}
                                />
                              ))}
                              {provided.placeholder}
                              
                              {/* Empty state */}
                              {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                <div className="flex flex-col items-center justify-center h-24 border border-dashed rounded-lg border-gray-300 text-gray-400 text-sm">
                                  <p>No tasks</p>
                                  <button 
                                    className="mt-2 px-3 py-1 bg-white rounded-md shadow-sm text-blue-600 text-xs hover:bg-blue-50"
                                    onClick={() => handleAddTask(column.id)}
                                  >
                                    Add a task
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              
              {/* Add column button */}
              <div className="ml-2 flex-shrink-0">
                <button className="w-72 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg border-2 border-dashed border-gray-300">
                  <FiPlus className="mr-2" />
                  Add Column
                </button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowTaskModal(false)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
};

export default KanbanBoard; 