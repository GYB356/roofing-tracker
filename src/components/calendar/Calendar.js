// src/components/calendar/Calendar.js
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import api from '../../services/api';
import DashboardLayout from '../layout/DashboardLayout';
import UpcomingJobs from './UpcomingJobs';
import CalendarEventModal from './CalendarEventModal';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const response = await api.get('/calendar/events', {
        params: { startDate, endDate }
      });
      
      setEvents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError('Failed to load calendar events. Please try again.');
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const eventsOnDay = events.filter(event => isSameDay(new Date(event.date), date));
    
    if (eventsOnDay.length === 1) {
      // If there's only one event, open it directly
      setSelectedEvent(eventsOnDay[0]);
      setShowModal(true);
    } else if (eventsOnDay.length > 1) {
      // If there are multiple events, we'll show them in a list view
      // This could be enhanced to show a popover with event selection
      setSelectedEvent(null);
      setShowModal(true);
    } else {
      // No events, allow creating a new one
      setSelectedEvent(null);
      setShowModal(true);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setSelectedDate(new Date(event.date));
    setShowModal(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (eventData.id) {
        // Update existing event
        await api.put(`/calendar/events/${eventData.id}`, eventData);
      } else {
        // Create new event
        await api.post('/calendar/events', eventData);
      }
      
      // Refresh events
      fetchEvents();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving event:', err);
      return err.response?.data?.message || 'Failed to save event. Please try again.';
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.delete(`/calendar/events/${eventId}`);
      fetchEvents();
      setShowModal(false);
    } catch (err) {
      console.error('Error deleting event:', err);
      return err.response?.data?.message || 'Failed to delete event. Please try again.';
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Create an array for all days in the calendar view (including padding days)
    const startDay = monthStart.getDay(); // 0 (Sunday) to 6 (Saturday)
    
    // Add empty cells for days before the first of the month
    const blanks = Array(startDay).fill(null);
    
    // Combine blanks and days
    const calendarDays = [...blanks, ...monthDays];
    
    // Create rows of 7 days each
    const rows = [];
    let cells = [];
    
    calendarDays.forEach((day, i) => {
      if (i % 7 !== 0) {
        cells.push(day);
      } else {
        rows.push(cells);
        cells = [day];
      }
    });
    
    // Add remaining cells
    if (cells.length > 0) {
      rows.push(cells);
      
      // Add empty cells for days after the end of the month if needed
      if (cells.length < 7) {
        cells.push(...Array(7 - cells.length).fill(null));
      }
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 text-center py-2 bg-gray-100 border-b">
          <div className="text-sm font-medium text-gray-500">Sun</div>
          <div className="text-sm font-medium text-gray-500">Mon</div>
          <div className="text-sm font-medium text-gray-500">Tue</div>
          <div className="text-sm font-medium text-gray-500">Wed</div>
          <div className="text-sm font-medium text-gray-500">Thu</div>
          <div className="text-sm font-medium text-gray-500">Fri</div>
          <div className="text-sm font-medium text-gray-500">Sat</div>
        </div>
        
        <div className="border-t">
          {rows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="grid grid-cols-7 text-center divide-x divide-y">
              {row.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`empty-${dayIndex}`} className="h-32 p-2 bg-gray-50"></div>;
                }
                
                const formattedDate = format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());
                const dayEvents = events.filter(event => 
                  isSameDay(new Date(event.date), day)
                );
                
                return (
                  <div 
                    key={formattedDate} 
                    className={`h-32 p-2 overflow-y-auto cursor-pointer hover:bg-gray-50 ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className={`text-right ${
                      isToday 
                        ? 'font-bold text-blue-600' 
                        : 'text-gray-700'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="mt-1 space-y-1">
                      {dayEvents.map(event => (
                        <div 
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded truncate text-white ${
                            event.type === 'project' ? 'bg-blue-500' :
                            event.type === 'meeting' ? 'bg-purple-500' :
                            event.type === 'installation' ? 'bg-green-500' :
                            event.type === 'delivery' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Schedule</h1>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setSelectedEvent(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Event
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            renderCalendar()
          )}
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Jobs</h2>
            <UpcomingJobs />
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <CalendarEventModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          event={selectedEvent}
          date={selectedDate}
        />
      )}
    </DashboardLayout>
  );
};

export default Calendar;

// src/components/calendar/UpcomingJobs.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';

const UpcomingJobs = ({ limit = 5 }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUpcomingJobs();
  }, []);

  const fetchUpcomingJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/calendar/upcoming', {
        params: { limit }
      });
      setJobs(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching upcoming jobs:', err);
      setError('Failed to load upcoming jobs.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No upcoming jobs scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map(job => (
        <div key={job.id} className="p-3 border rounded-lg hover:bg-gray-50">
          <div className="flex justify-between">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              job.type === 'project' ? 'bg-blue-100 text-blue-800' :
              job.type === 'meeting' ? 'bg-purple-100 text-purple-800' :
              job.type === 'installation' ? 'bg-green-100 text-green-800' :
              job.type === 'delivery' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(job.date), 'MMM d, yyyy')}
            </span>
          </div>
          <h3 className="mt-2 font-medium text-gray-900">{job.title}</h3>
          {job.projectId && (
            <Link 
              to={`/projects/${job.projectId}`} 
              className="mt-1 text-sm text-blue-600 hover:text-blue-800 inline-block"
            >
              View Project
            </Link>
          )}
          {job.description && (
            <p className="mt-1 text-sm text-gray-600 truncate">
              {job.description}
            </p>
          )}
        </div>
      ))}
      <Link 
        to="/calendar" 
        className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-2"
      >
        View Full Calendar
      </Link>
    </div>
  );
};

export default UpcomingJobs;

// src/components/calendar/CalendarEventModal.js
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';

const CalendarEventModal = ({ isOpen, onClose, onSave, onDelete, event, date }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: format(date || new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    duration: 60,
    type: 'project',
    projectId: '',
    description: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (event) {
      const eventTime = new Date(event.date);
      setFormData({
        ...event,
        date: format(new Date(event.date), 'yyyy-MM-dd'),
        time: format(eventTime, 'HH:mm')
      });
    } else if (date) {
      setFormData(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    }

    fetchProjects();
  }, [event, date]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects', { params: { status: 'in-progress' } });
      setProjects(response.data.projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Combine date and time
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Prepare event data
      const eventData = {
        ...formData,
        date: eventDateTime.toISOString()
      };
      
      // If it's an existing event, include the ID
      if (event?.id) {
        eventData.id = event.id;
      }
      
      const result = await onSave(eventData);
      
      if (result) {
        // If onSave returns an error message
        setError(result);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      setLoading(true);
      
      try {
        const result = await onDelete(event.id);
        
        if (result) {
          // If onDelete returns an error message
          setError(result);
          setLoading(false);
        }
      } catch (err) {
        setError(err.message || 'An error occurred. Please try again.');
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {event ? 'Edit Event' : 'Add Event'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title*
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date*
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time*
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type*
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="project">Project</option>
                <option value="meeting">Meeting</option>
                <option value="installation">Installation</option>
                <option value="delivery">Material Delivery</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="15"
                step="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Project
            </label>
            <select
              name="projectId"
              value={formData.projectId || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">None</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          <div className="flex justify-between pt-4">
            {event ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : event ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarEventModal;