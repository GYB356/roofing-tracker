import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiFileText, 
  FiTag, 
  FiX, 
  FiEdit, 
  FiTrash2,
  FiMessageSquare,
  FiVideo,
  FiPhone,
  FiHome
} from 'react-icons/fi';
import { formatDate, formatTime } from '../../utils/dateUtils';

const AppointmentDetails = ({ appointment, onClose, onEdit, onDelete }) => {
  const { currentUser } = useAuth();
  
  if (!appointment) return null;
  
  const getStatusClass = () => {
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
  
  const getAppointmentStatus = () => {
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
  
  const getLocationIcon = () => {
    switch (appointment.location) {
      case 'video':
        return <FiVideo className="h-5 w-5 text-primary-500" />;
      case 'phone':
        return <FiPhone className="h-5 w-5 text-primary-500" />;
      case 'home':
        return <FiHome className="h-5 w-5 text-primary-500" />;
      default:
        return <FiMapPin className="h-5 w-5 text-primary-500" />;
    }
  };
  
  const getLocationText = () => {
    switch (appointment.location) {
      case 'video':
        return 'Video Call';
      case 'phone':
        return 'Phone Call';
      case 'home':
        return 'Home Visit';
      default:
        return 'In-Person';
    }
  };
  
  const canJoin = () => {
    const now = new Date();
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    
    // Can join 15 minutes before start time and until end time
    const joinWindow = new Date(startTime);
    joinWindow.setMinutes(joinWindow.getMinutes() - 15);
    
    return (
      (appointment.location === 'video' || appointment.location === 'phone') &&
      now >= joinWindow &&
      now <= endTime &&
      appointment.status !== 'cancelled'
    );
  };
  
  const handleJoin = () => {
    // In a real app, this would navigate to the telemedicine interface
    // or initiate a call based on the appointment type
    alert('Joining virtual appointment...');
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Appointment Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {appointment.title || 'Appointment'}
            </h3>
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass()}`}>
              {getAppointmentStatus()}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FiCalendar className="h-5 w-5 text-primary-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Date</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(appointment.startTime)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FiClock className="h-5 w-5 text-primary-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Time</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                {getLocationIcon()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getLocationText()}
                </p>
                {canJoin() && (
                  <button
                    onClick={handleJoin}
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {appointment.location === 'video' ? 'Join Video Call' : 'Join Phone Call'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FiUser className="h-5 w-5 text-primary-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentUser.role === 'patient' ? 'Provider' : 'Patient'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentUser.role === 'patient' 
                    ? `Dr. ${appointment.provider?.name || 'Unknown Provider'}`
                    : `${appointment.patient?.name || 'Unknown Patient'}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FiTag className="h-5 w-5 text-primary-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Type</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {appointment.type === 'general' ? 'General Check-up' :
                   appointment.type === 'specialist' ? 'Specialist Consultation' :
                   appointment.type === 'follow-up' ? 'Follow-up' :
                   appointment.type === 'emergency' ? 'Emergency' :
                   appointment.type === 'procedure' ? 'Procedure' :
                   appointment.type === 'lab' ? 'Lab Work' :
                   appointment.type === 'imaging' ? 'Imaging' :
                   appointment.type === 'therapy' ? 'Therapy' :
                   appointment.type}
                </p>
              </div>
            </div>
            
            {appointment.notes && (
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <FiFileText className="h-5 w-5 text-primary-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Notes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                    {appointment.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onDelete(appointment._id)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiTrash2 className="mr-2 h-4 w-4" />
              Cancel Appointment
            </button>
            
            <div className="flex space-x-3">
              {appointment.location === 'video' && (
                <button
                  onClick={() => {
                    onClose();
                    // In a real app, this would navigate to the messaging interface
                    alert('Opening messaging...');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FiMessageSquare className="mr-2 h-4 w-4" />
                  Message
                </button>
              )}
              
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiEdit className="mr-2 h-4 w-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails; 