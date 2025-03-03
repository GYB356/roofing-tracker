import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import Calendar from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { startOfWeek, format } from 'date-fns';

const Appointments = () => {
  const { user, hasRole } = useAuth();
  const { socket } = useSocket();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!hasRole(['doctor', 'nurse', 'admin', 'patient'])) {
      setError('Access Denied');
      return;
    }

    fetchAppointments();

    if (socket) {
      socket.on('appointmentCreated', handleAppointmentUpdate);
      socket.on('appointmentUpdated', handleAppointmentUpdate);
      socket.on('appointmentDeleted', handleAppointmentDelete);
    }

    return () => {
      if (socket) {
        socket.off('appointmentCreated', handleAppointmentUpdate);
        socket.off('appointmentUpdated', handleAppointmentUpdate);
        socket.off('appointmentDeleted', handleAppointmentDelete);
      }
    };
  }, [hasRole, socket]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/appointments');
      setAppointments(response.data.map(formatAppointment));
      setError(null);
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatAppointment = (appointment) => ({
    id: appointment.id,
    title: `${appointment.patientName} - ${appointment.type}`,
    start: new Date(appointment.startTime),
    end: new Date(appointment.endTime),
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    type: appointment.type,
    status: appointment.status,
    notes: appointment.notes
  });

  const handleAppointmentUpdate = (appointment) => {
    setAppointments(prev => {
      const index = prev.findIndex(apt => apt.id === appointment.id);
      if (index === -1) {
        return [...prev, formatAppointment(appointment)];
      }
      const newAppointments = [...prev];
      newAppointments[index] = formatAppointment(appointment);
      return newAppointments;
    });
  };

  const handleAppointmentDelete = (appointmentId) => {
    setAppointments(prev => 
      prev.filter(appointment => appointment.id !== appointmentId)
    );
  };

  const handleSelectSlot = ({ start, end }) => {
    if (!hasRole(['doctor', 'staff', 'admin'])) return;

    setSelectedAppointment({
      start,
      end,
      patientId: '',
      doctorId: '',
      type: 'consultation',
      status: 'scheduled',
      notes: ''
    });
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedAppointment(event);
    setShowModal(true);
  };

  const handleSaveAppointment = async (formData) => {
    try {
      const appointmentData = {
        ...formData,
        startTime: formData.start.toISOString(),
        endTime: formData.end.toISOString()
      };

      let response;
      if (formData.id) {
        response = await axios.put(`/api/appointments/${formData.id}`, appointmentData);
      } else {
        response = await axios.post('/api/appointments', appointmentData);
      }

      handleAppointmentUpdate(response.data);
      setShowModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      setError('Failed to save appointment');
      console.error(err);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      await axios.delete(`/api/appointments/${appointmentId}`);
      handleAppointmentDelete(appointmentId);
      setShowModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      setError('Failed to delete appointment');
      console.error(err);
    }
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!appointments.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Appointments</h2>
              <p className="mt-1 text-sm text-gray-300">
                Schedule and manage appointments
              </p>
            </div>
            {hasRole(['doctor', 'staff', 'admin']) && (
              <button
                onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none"
              >
                New Appointment
              </button>
            )}
          </div>

          {/* Calendar */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <Calendar
              localizer={{
                startOfWeek: () => startOfWeek(new Date()),
                format: (date, formatStr) => format(date, formatStr),
                formats: {
                  timeGutterFormat: 'HH:mm',
                  eventTimeRangeFormat: ({ start, end }) =>
                    `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
                  dayFormat: 'dd'
                }
              }}
              events={appointments}
              defaultView="week"
              views={['day', 'week', 'month']}
              step={30}
              timeslots={2}
              selectable={hasRole(['doctor', 'staff', 'admin'])}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              className="h-[600px]"
            />
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedAppointment.id ? 'Edit Appointment' : 'New Appointment'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleSaveAppointment({
                  id: selectedAppointment.id,
                  patientId: formData.get('patientId'),
                  doctorId: formData.get('doctorId'),
                  type: formData.get('type'),
                  status: formData.get('status'),
                  notes: formData.get('notes'),
                  start: selectedAppointment.start,
                  end: selectedAppointment.end
                });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Patient ID
                </label>
                <input
                  type="text"
                  name="patientId"
                  defaultValue={selectedAppointment.patientId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Doctor ID
                </label>
                <input
                  type="text"
                  name="doctorId"
                  defaultValue={selectedAppointment.doctorId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  name="type"
                  defaultValue={selectedAppointment.type}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="procedure">Procedure</option>
                  <option value="test">Test</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={selectedAppointment.status}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  defaultValue={selectedAppointment.notes}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows="3"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                {selectedAppointment.id && hasRole(['doctor', 'staff', 'admin']) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;