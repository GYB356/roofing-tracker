import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiCalendar, FiClock, FiUser, FiPlus, FiFilter, FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import AppointmentForm from './AppointmentForm';
import AppointmentDetails from './AppointmentDetails';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { useSocket } from '../../contexts/SocketContext';

const Appointments = () => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
    
    // Listen for real-time appointment updates
    if (socket) {
      socket.on('appointment:created', handleAppointmentCreated);
      socket.on('appointment:updated', handleAppointmentUpdated);
      socket.on('appointment:deleted', handleAppointmentDeleted);
      
      return () => {
        socket.off('appointment:created');
        socket.off('appointment:updated');
        socket.off('appointment:deleted');
      };
    }
  }, [socket]);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      
      const data = await response.json();
      setAppointments(data);
      setError('');
    } catch (err) {
      setError('Error loading appointments. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAppointmentCreated = (appointment) => {
    setAppointments(prev => [...prev, appointment]);
  };
  
  const handleAppointmentUpdated = (updatedAppointment) => {
    setAppointments(prev => 
      prev.map(app => app._id === updatedAppointment._id ? updatedAppointment : app)
    );
    
    if (selectedAppointment && selectedAppointment._id === updatedAppointment._id) {
      setSelectedAppointment(updatedAppointment);
    }
  };
  
  const handleAppointmentDeleted = (appointmentId) => {
    setAppointments(prev => prev.filter(app => app._id !== appointmentId));
    
    if (selectedAppointment && selectedAppointment._id === appointmentId) {
      setSelectedAppointment(null);
      setShowDetails(false);
    }
  };
  
  const handleCreateAppointment = () => {
    setSelectedAppointment(null);
    setShowForm(true);
  };
  
  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowForm(true);
  };
  
  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };
  
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      
      // The socket will handle the state update
    } catch (err) {
      setError('Error cancelling appointment. Please try again.');
      console.error(err);
    }
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setSelectedAppointment(null);
  };
  
  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedAppointment(null);
  };
  
  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Apply filter
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(app => new Date(app.startTime) > now);
        break;
      case 'past':
        filtered = filtered.filter(app => new Date(app.startTime) < now);
        break;
      case 'today':
        const today = new Date(now.setHours(0, 0, 0, 0));
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter(app => {
          const appDate = new Date(app.startTime);
          return appDate >= today && appDate < tomorrow;
        });
        break;
      default:
        break;
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        (app.title && app.title.toLowerCase().includes(term)) ||
        (app.provider && app.provider.name && app.provider.name.toLowerCase().includes(term)) ||
        (app.patient && app.patient.name && app.patient.name.toLowerCase().includes(term)) ||
        (app.notes && app.notes.toLowerCase().includes(term))
      );
    }
    
    // Sort by date (newest first for upcoming, oldest first for past)
    filtered.sort((a, b) => {
      if (filter === 'past') {
        return new Date(b.startTime) - new Date(a.startTime);
      }
      return new Date(a.startTime) - new Date(b.startTime);
    });
    
    return filtered;
  };
  
  const filteredAppointments = filterAppointments();
  
  const getStatusClass = (appointment) => {
    const now = new Date();
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    
    if (appointment.status === 'cancelled') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    } else if (now > endTime) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    } else if (now >= startTime && now <= endTime) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };
  
  const getAppointmentStatus = (appointment) => {
    const now = new Date();
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    
    if (appointment.status === 'cancelled') {
      return 'Cancelled';
    } else if (now > endTime) {
      return 'Completed';
    } else if (now >= startTime && now <= endTime) {
      return 'In Progress';
    } else {
      return 'Scheduled';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          <FiCalendar className="inline-block mr-2" />
          Appointments
        </h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:w-64 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:w-auto dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Appointments</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="today">Today</option>
            </select>
          </div>
          
          <button
            onClick={handleCreateAppointment}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiPlus className="mr-2" />
            New Appointment
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiX className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No appointments found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filter === 'upcoming' 
              ? "You don't have any upcoming appointments." 
              : filter === 'past' 
                ? "You don't have any past appointments." 
                : "No appointments match your search criteria."}
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateAppointment}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiPlus className="mr-2" />
              Schedule an Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAppointments.map((appointment) => (
              <li key={appointment._id}>
                <div 
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleViewDetails(appointment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getStatusClass(appointment)}`}>
                        <FiClock className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.title || 'Appointment'}
                        </p>
                        <div className="flex items-center">
                          <FiUser className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {currentUser.role === 'patient' 
                              ? `Dr. ${appointment.provider?.name || 'Unknown Provider'}`
                              : `${appointment.patient?.name || 'Unknown Patient'}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(appointment)}`}>
                        {getAppointmentStatus(appointment)}
                      </span>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>
                          {formatDate(appointment.startTime)} • {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    {appointment.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAppointment(appointment);
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <FiEdit className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAppointment(appointment._id);
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FiTrash2 className="mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {showForm && (
        <AppointmentForm
          appointment={selectedAppointment}
          onClose={handleFormClose}
        />
      )}
      
      {showDetails && selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={handleDetailsClose}
          onEdit={() => {
            handleDetailsClose();
            handleEditAppointment(selectedAppointment);
          }}
          onDelete={() => {
            handleDetailsClose();
            handleDeleteAppointment(selectedAppointment._id);
          }}
        />
      )}
    </div>
  );
};

export default Appointments; 