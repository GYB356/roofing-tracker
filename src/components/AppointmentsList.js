import React from 'react';
import { useAppointments } from '../contexts/AppointmentsContext.js';

const AppointmentsList = () => {
  const { appointments, loading, error } = useAppointments();

  if (loading) return <div>Loading appointments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="appointments-list">
      <h2>Upcoming Appointments</h2>
      {appointments.length === 0 ? (
        <p>No upcoming appointments</p>
      ) : (
        <ul>
          {appointments.map(appt => (
            <li key={appt.id}>
              <h3>{appt.title}</h3>
              <p>Date: {new Date(appt.date).toLocaleDateString()}</p>
              <p>Provider: {appt.providerName}</p>
              <p>Status: {appt.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AppointmentsList;