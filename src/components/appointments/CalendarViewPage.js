import React from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiList, FiCalendar, FiChevronLeft, FiChevronRight, FiMapPin } from 'react-icons/fi';

// Inline PageLayout component
const PageLayout = ({ 
  title, 
  description, 
  bgColor = "bg-blue-600", 
  textColor = "text-blue-100", 
  children,
  actions
}) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-screen-xl">
      <div className={`${bgColor} rounded-t-lg shadow-lg overflow-hidden`}>
        <div className="px-6 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className={`mt-2 ${textColor}`}>{description}</p>
            </div>
            {actions && (
              <div className="ml-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

const CalendarViewPage = () => {
  const actionButtons = (
    <Link to="/appointments/new" className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
      <FiPlus className="mr-2" />
      New Appointment
    </Link>
  );

  // Sample appointment data
  const appointments = [
    { 
      id: 1, 
      title: 'Annual Physical',
      provider: 'Dr. Sarah Johnson',
      location: 'Main Office - 123 Medical Dr.',
      date: '2024-03-12',
      time: '10:00 AM',
      status: 'confirmed'
    },
    { 
      id: 2, 
      title: 'Dental Checkup',
      provider: 'Dr. Emily Watson',
      location: 'Downtown Clinic - 456 Health Ave.',
      date: '2024-03-14',
      time: '2:30 PM',
      status: 'confirmed'
    },
    { 
      id: 3, 
      title: 'Lab Work',
      provider: 'LabCorp',
      location: 'North Side Location - 789 Care Blvd.',
      date: '2024-03-15',
      time: '8:15 AM',
      status: 'confirmed'
    }
  ];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // First day of the month
  const firstDay = new Date(currentYear, currentMonth, 1);
  // Last day of the month
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  
  // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDay.getDay();
  
  // Total days in the month
  const totalDaysInMonth = lastDay.getDate();
  
  // Generate array of days
  const daysArray = [];
  
  // Fill in empty slots for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push({ day: "", isCurrentMonth: false });
  }
  
  // Fill in the days of the month
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    
    // Check if any appointments fall on this day
    const dayAppointments = appointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return apptDate.getDate() === day && 
             apptDate.getMonth() === currentMonth && 
             apptDate.getFullYear() === currentYear;
    });
    
    daysArray.push({
      day,
      isCurrentMonth: true,
      isToday: day === currentDate.getDate(),
      hasAppointment: dayAppointments.length > 0,
      appointments: dayAppointments
    });
  }
  
  // Fill in remaining slots to complete the grid (if needed)
  const totalCells = Math.ceil(daysArray.length / 7) * 7;
  const remainingCells = totalCells - daysArray.length;
  
  for (let i = 0; i < remainingCells; i++) {
    daysArray.push({ day: "", isCurrentMonth: false });
  }
  
  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return (
    <PageLayout
      title="Appointments Calendar"
      description="View your appointments in a calendar layout."
      bgColor="bg-blue-600"
      textColor="text-blue-100"
      actions={actionButtons}
    >
      <div className="mb-6">
        <div className="flex space-x-4 mb-6">
          <Link 
            to="/appointments" 
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
          >
            <FiList className="mr-2" />
            List View
          </Link>
          <Link 
            to="/appointments/calendar" 
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
          >
            <FiCalendar className="mr-2" />
            Calendar View
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {`${monthNames[currentMonth]} ${currentYear}`}
            </h3>
            <div className="flex space-x-2">
              <button className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                <FiChevronLeft />
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-md">
                Today
              </button>
              <button className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                <FiChevronRight />
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Names */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={index} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {daysArray.map((dayData, index) => (
                <div 
                  key={index} 
                  className={`min-h-24 p-1 border ${
                    dayData.isCurrentMonth 
                      ? dayData.isToday
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700' 
                      : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20'
                  } rounded-lg ${dayData.isCurrentMonth ? 'hover:border-blue-500 cursor-pointer' : ''}`}
                >
                  {dayData.day !== "" && (
                    <>
                      <div className={`text-right text-sm ${
                        dayData.isToday 
                          ? 'font-bold text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {dayData.day}
                      </div>
                      {dayData.hasAppointment && (
                        <div className="mt-1">
                          {dayData.appointments.map((appt, apptIndex) => (
                            <div 
                              key={apptIndex} 
                              className="text-xs p-1 mb-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded overflow-hidden text-ellipsis whitespace-nowrap"
                              title={`${appt.time} - ${appt.title} with ${appt.provider}`}
                            >
                              {appt.time} - {appt.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upcoming Appointments</h3>
        
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{appointment.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">with {appointment.provider}</p>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <FiCalendar className="mr-1" /> {appointment.date} at {appointment.time}
                    </div>
                    <div className="flex items-center mt-1">
                      <FiMapPin className="mr-1" /> {appointment.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full mb-2">
                    Confirmed
                  </span>
                  <div className="flex space-x-2 mt-4">
                    <button className="px-3 py-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                      Reschedule
                    </button>
                    <button className="px-3 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default CalendarViewPage;