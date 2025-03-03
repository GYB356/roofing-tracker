import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const StaffScheduling = () => {
  const { user, hasRole } = useAuth();
  const { socket, updateSchedule } = useSocket();
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasRole(['admin', 'staff'])) {
      setError('Access Denied');
      return;
    }

    // Fetch staff schedules
    const fetchSchedules = async () => {
      try {
        const response = await fetch('/api/staff/schedule');
        const data = await response.json();
        setSchedules(data);
      } catch (err) {
        setError('Failed to load schedules');
      }
    };

    fetchSchedules();
  }, [hasRole]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!schedules.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className="staff-scheduling-page p-4">
      <h1 className="text-2xl font-bold">Staff Scheduling</h1>
      <ul>
        {schedules.map(schedule => (
          <li key={schedule.id} className="mb-2">
            {schedule.staffName} - {schedule.department} ({schedule.startTime} to {schedule.endTime})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StaffScheduling;