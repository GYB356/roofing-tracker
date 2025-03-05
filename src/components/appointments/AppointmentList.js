// src/components/appointments/AppointmentList.js
import React from 'react';
import { useAppointments } from '../../contexts/AppointmentContext';
import { format, isToday, isTomorrow, isAfter, addDays } from 'date-fns';

const AppointmentList = () => {
  const { getUpcomingAppointments, getPastAppointments, cancelAppointment, loading, error } = useAppointments();
  
  const upcomingAppointments = getUpcomingAppointments();
  const pastAppointments = getPastAppointments();
  
  const getAppointmentStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">Scheduled</span>;
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">Confirmed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">Cancelled</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">Completed</span>;
      case 'no-show':
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">No Show</span>;
      default:
        return null;
    }
  };
  
  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      const reason = prompt('Please provide a reason for cancellation (optional):');
      await cancelAppointment(appointmentId, reason || '');
    }
  };
  
  // Group upcoming appointments by day
  const groupedAppointments = upcomingAppointments.reduce((groups, appointment) => {
    const date = new Date(appointment.startTime);
    let key = 'future';
    
    if (isToday(date)) {
      key = 'today';
    } else if (isTomorrow(date)) {
      key = 'tomorrow';
    } else if (isAfter(date, new Date()) && !isAfter(date, addDays(new Date(), 7))) {
      key = 'thisWeek';
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    groups[key].push(appointment);
    return groups;
  }, {});
  
  const renderAppointmentCard = (appointment) => {
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    
    return (
      <div 
        key={appointment.id}
        className="border rounded-lg p-4 bg-white shadow-sm hover:shadow transition-shadow mb-3"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{appointment.title}</h3>
            <p className="text-gray-600">{format(startTime, 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-gray-600">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </p>
            {appointment.location && (
              <p className="text-gray-600 mt-1">{appointment.location.name}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            {getAppointmentStatusBadge(appointment.status)}
            
            <div className="mt-auto pt-4 flex space-x-2">
              <button 
                onClick={() => handleViewDetails(appointment.id)}
                className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800"
              >
                View Details
              </button>
              
              {appointment.status === 'scheduled' && (
                <button 
                  onClick={() => handleCancelAppointment(appointment.id)}
                  className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const handleViewDetails = (appointmentId) => {
    // Navigate to appointment details
    console.log(`View appointment details: ${appointmentId}`);
  };
  
  if (loading) {
    return <div className="text-center py-6">Loading appointments...</div>;
  }
  
  if (error) {
    return <div className="text-center py-6 text-red-600">{error}</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Your Appointments</h2>
      </div>
      
      <div className="p-4">
        {/* Today's Appointments */}
        {groupedAppointments.today && groupedAppointments.today.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Today</h3>
            {groupedAppointments.today.map(renderAppointmentCard)}
          </div>
        )}
        
        {/* Tomorrow's Appointments */}
        {groupedAppointments.tomorrow && groupedAppointments.tomorrow.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Tomorrow</h3>
            {groupedAppointments.tomorrow.map(renderAppointmentCard)}
          </div>
        )}
        
        {/* This Week's Appointments */}
        {groupedAppointments.thisWeek && groupedAppointments.thisWeek.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">This Week</h3>
            {groupedAppointments.thisWeek.map(renderAppointmentCard)}
          </div>
        )}
        
        {/* Future Appointments */}
        {groupedAppointments.future && groupedAppointments.future.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Upcoming</h3>
            {groupedAppointments.future.map(renderAppointmentCard)}
          </div>
        )}
        
        {/* No upcoming appointments */}
        {upcomingAppointments.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You have no upcoming appointments.</p>
            <button 
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => console.log('Schedule new appointment')}
            >
              Schedule an Appointment
            </button>
          </div>
        )}
        
        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3 border-t pt-6">Past Appointments</h3>
            <div className="max-h-96 overflow-y-auto">
              {pastAppointments.slice(0, 10).map(renderAppointmentCard)}
            </div>
            
            {pastAppointments.length > 10 && (
              <div className="text-center mt-4">
                <button className="text-blue-600 hover:text-blue-800">
                  View All Past Appointments
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;