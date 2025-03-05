import React from 'react';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

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

const ScheduleNewPage = () => {
  const actionButtons = (
    <Link to="/appointments" className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
      <FiArrowLeft className="mr-2" />
      Back to Appointments
    </Link>
  );

  // Sample provider options
  const providers = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Family Medicine', availableSoon: true },
    { id: 2, name: 'Dr. Michael Lee', specialty: 'Internal Medicine', availableSoon: true },
    { id: 3, name: 'Dr. Jennifer Williams', specialty: 'Cardiology', availableSoon: false },
    { id: 4, name: 'Dr. Robert Chen', specialty: 'Endocrinology', availableSoon: true },
    { id: 5, name: 'Dr. Emily Watson', specialty: 'Dermatology', availableSoon: false }
  ];

  // Sample appointment types
  const appointmentTypes = [
    { id: 1, name: 'Annual Physical', duration: '30 min', inPerson: true, telehealth: false },
    { id: 2, name: 'Follow-up Visit', duration: '15 min', inPerson: true, telehealth: true },
    { id: 3, name: 'New Patient Consultation', duration: '45 min', inPerson: true, telehealth: true },
    { id: 4, name: 'Prescription Refill', duration: '10 min', inPerson: false, telehealth: true },
    { id: 5, name: 'Lab Results Review', duration: '15 min', inPerson: true, telehealth: true }
  ];

  return (
    <PageLayout
      title="Schedule New Appointment"
      description="Book a new appointment with your healthcare provider."
      bgColor="bg-blue-600"
      textColor="text-blue-100"
      actions={actionButtons}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointment Details</h2>
          
          <div className="space-y-6">
            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Appointment Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {appointmentTypes.slice(0, 3).map((type) => (
                  <div 
                    key={type.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full border border-blue-500 flex-shrink-0 mt-0.5 mr-3">
                        <div className="h-3 w-3 rounded-full bg-blue-500 m-0.5"></div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{type.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration: {type.duration}</p>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Available: {type.inPerson && 'In-person'} {type.inPerson && type.telehealth && '/'} {type.telehealth && 'Telehealth'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Provider
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {providers.slice(0, 4).map((provider) => (
                  <div 
                    key={provider.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-10 w-10 flex items-center justify-center text-gray-600 dark:text-gray-300 mr-3">
                        <FiUser />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{provider.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{provider.specialty}</p>
                        {provider.availableSoon && (
                          <span className="text-xs text-green-600 dark:text-green-400">Available this week</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visit Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full border border-blue-500 flex-shrink-0 mr-3">
                      <div className="h-3 w-3 rounded-full bg-blue-500 m-0.5"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">In-Person Visit</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Visit the clinic in person</p>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors">
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full border border-gray-300 flex-shrink-0 mr-3"></div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Telehealth Visit</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Virtual appointment via video</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Date & Time
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FiCalendar className="text-blue-500 mr-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Date</h3>
                  </div>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    defaultValue="2024-03-10"
                  />
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FiClock className="text-blue-500 mr-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Time</h3>
                  </div>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <option>9:00 AM</option>
                    <option>9:30 AM</option>
                    <option>10:00 AM</option>
                    <option>10:30 AM</option>
                    <option>11:00 AM</option>
                    <option>11:30 AM</option>
                    <option>1:00 PM</option>
                    <option>1:30 PM</option>
                    <option>2:00 PM</option>
                  </select>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FiMapPin className="text-blue-500 mr-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Location</h3>
                  </div>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <option>Main Office - 123 Medical Dr.</option>
                    <option>Downtown Clinic - 456 Health Ave.</option>
                    <option>North Side Location - 789 Care Blvd.</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Reason for Visit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Visit
              </label>
              <div className="flex items-start">
                <FiMessageSquare className="text-blue-500 mt-1 mr-2" />
                <textarea 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200" 
                  rows="3"
                  placeholder="Please provide any additional information or concerns about your visit"
                ></textarea>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg">
                Schedule Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ScheduleNewPage;