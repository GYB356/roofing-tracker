// src/components/appointments/AppointmentCalendar.js
import React, { useState, useEffect } from 'react';
import { useAppointments } from '../../contexts/AppointmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfWeek, addDays, startOfDay, addHours, isSameDay } from 'date-fns';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

const AppointmentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState([]);
  const { appointments, loading, error } = useAppointments();
  const { currentUser } = useAuth();
  
  // Calculate week days based on current date
  useEffect(() => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Week starts on Monday
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDate, i));
    }
    
    setWeekDays(days);
  }, [currentDate]);
  
  // Navigate to previous or next week
  const navigateWeek = (direction) => {
    setCurrentDate(prevDate => addDays(prevDate, direction * 7));
  };
  
  // Get appointments for a specific day and hour
  const getAppointmentsForTimeSlot = (day, hour) => {
    const startTime = addHours(startOfDay(day), hour);
    const endTime = addHours(startOfDay(day), hour + 1);
    
    return appointments.filter(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      
      return (
        (currentUser.role === 'admin' || apt.providerId === currentUser.id || apt.patientId === currentUser.id) &&
        apt.status !== 'cancelled' &&
        isSameDay(aptStart, day) &&
        aptStart.getHours() === hour
      );
    });
  };
  
  // Render time slots for the weekly calendar
  const renderTimeSlots = () => {
    return HOURS.map(hour => (
      <tr key={hour}>
        <td className="border px-2 py-1 text-sm font-medium bg-gray-50">
          {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
        </td>
        
        {weekDays.map(day => {
          const dayAppointments = getAppointmentsForTimeSlot(day, hour);
          
          return (
            <td 
              key={day.toISOString()} 
              className="border px-2 py-1 relative min-h-[60px]"
            >
              {dayAppointments.length > 0 ? (
                dayAppointments.map(apt => (
                  <div 
                    key={apt.id}
                    className="p-1 rounded text-xs bg-blue-100 border border-blue-300 overflow-hidden mb-1 cursor-pointer"
                    onClick={() => onAppointmentClick(apt.id)}
                  >
                    <div className="font-medium truncate">{apt.title}</div>
                    <div className="truncate text-gray-600">
                      {format(new Date(apt.startTime), 'h:mm a')} - 
                      {format(new Date(apt.endTime), 'h:mm a')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full h-full min-h-[40px]"></div>
              )}
            </td>
          );
        })}
      </tr>
    ));
  };
  
  const onAppointmentClick = (appointmentId) => {
    // Navigate to appointment details page
    // Implementation depends on your routing setup
    console.log(`View appointment: ${appointmentId}`);
  };
  
  if (loading) {
    return <div className="text-center py-6">Loading calendar...</div>;
  }
  
  if (error) {
    return <div className="text-center py-6 text-red-600">{error}</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold">Appointments Calendar</h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => navigateWeek(-1)}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Previous Week
          </button>
          
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Today
          </button>
          
          <button 
            onClick={() => navigateWeek(1)}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Next Week
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 w-20"></th>
              {weekDays.map(day => (
                <th key={day.toISOString()} className="border p-2 bg-gray-50">
                  <div className="font-medium">{format(day, 'EEEE')}</div>
                  <div className="text-sm">{format(day, 'MMM d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderTimeSlots()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentCalendar;