import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const StaffScheduling = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';

  const fetchWithSecurityHeaders = async (url, options = {}) => {
    const defaultHeaders = {
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';",
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const headers = { ...defaultHeaders, ...options.headers };
    return fetch(url, { ...options, headers });
  };

  const validateScheduleData = (scheduleData) => {
    const { title, date, time } = scheduleData;
    if (!title || !date || !time) {
      throw new Error('All fields are required.');
    }
    // Additional validation rules can be added here
  };

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithSecurityHeaders('/api/schedules');

      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }

      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchSchedules();

    // Log access for HIPAA compliance
    logHipaaAccess('view');

    // Socket event listeners for real-time updates
    socket.on('schedule:update', handleScheduleUpdate);
    socket.on('schedule:new', handleNewSchedule);
    socket.on('schedule:delete', handleScheduleDelete);

    return () => {
      socket.off('schedule:update', handleScheduleUpdate);
      socket.off('schedule:new', handleNewSchedule);
      socket.off('schedule:delete', handleScheduleDelete);
    };
  }, [isAuthenticated, fetchSchedules]);

  const logHipaaAccess = (action) => {
    socket.emit('hipaa:log-access', {
      resourceType: 'scheduling',
      action,
      timestamp: new Date()
    });
  };

  const handleScheduleUpdate = (updatedSchedule) => {
    setSchedules(prevSchedules => {
      const exists = prevSchedules.some(schedule => schedule._id === updatedSchedule._id);
      if (exists) {
        return prevSchedules.map(schedule => 
          schedule._id === updatedSchedule._id ? updatedSchedule : schedule
        );
      } else {
        return [...prevSchedules, updatedSchedule];
      }
    });
  };

  const handleNewSchedule = (newSchedule) => {
    setSchedules(prevSchedules => [...prevSchedules, newSchedule]);
  };

  const handleScheduleDelete = (deletedId) => {
    setSchedules(prevSchedules => 
      prevSchedules.filter(schedule => schedule._id !== deletedId)
    );
  };

  const addSchedule = async (scheduleData) => {
    try {
      setLoading(true);
      validateScheduleData(scheduleData);
      const response = await fetchWithSecurityHeaders('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });

      if (!response.ok) {
        throw new Error('Failed to add schedule');
      }

      const newSchedule = await response.json();
      setSchedules(prev => [...prev, newSchedule]);
      logHipaaAccess('modify');
      socket.emit('schedule:new', newSchedule);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editSchedule = async (scheduleData) => {
    try {
      setLoading(true);
      validateScheduleData(scheduleData);
      const response = await fetchWithSecurityHeaders(`/api/schedules/${scheduleData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      const updatedSchedule = await response.json();
      setSchedules(prev => 
        prev.map(schedule => 
          schedule._id === updatedSchedule._id ? updatedSchedule : schedule
        )
      );
      logHipaaAccess('modify');
      socket.emit('schedule:update', updatedSchedule);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id) => {
    try {
      setLoading(true);
      const response = await fetchWithSecurityHeaders(`/api/schedules/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      setSchedules(prev => prev.filter(schedule => schedule._id !== id));
      logHipaaAccess('modify');
      socket.emit('schedule:delete', id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddScheduleModal = () => {
    // Logic to open modal for adding schedule
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Staff Scheduling</h2>
        {(isAdmin || isDoctor) && (
          <button
            onClick={openAddScheduleModal}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Add Schedule"
            role="button"
          >
            <FiPlus className="mr-1.5 h-4 w-4" />
            Add Schedule
          </button>
        )}
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-red-500" role="alert">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map(schedule => (
            <div key={schedule._id} className="border border-gray-200 rounded-lg p-4 relative">
              <div className="flex items-center mb-2">
                <span className="font-medium text-gray-900">
                  {schedule.title}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {schedule.date}
              </p>
              <p className="text-sm text-gray-500">
                {schedule.time}
              </p>
              <div className="mt-4 flex justify-end space-x-2">
                {(isAdmin || isDoctor) && (
                  <>
                    <button
                      onClick={() => editSchedule(schedule)}
                      className="text-xs text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-label="Edit Schedule"
                      role="button"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule._id)}
                      className="text-xs text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      aria-label="Delete Schedule"
                      role="button"
                    >
                      <FiTrash />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffScheduling; 