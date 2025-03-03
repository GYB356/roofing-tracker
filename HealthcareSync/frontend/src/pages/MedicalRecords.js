import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const MedicalRecords = () => {
  const { user, hasRole } = useAuth();
  const { socket } = useSocket();
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasRole(['doctor', 'nurse', 'admin', 'patient'])) {
      setError('Access Denied');
      return;
    }

    // Fetch medical records data
    const fetchRecords = async () => {
      try {
        const response = await fetch('/api/medical-records');
        const data = await response.json();
        setRecords(data);
      } catch (err) {
        setError('Failed to load medical records');
      }
    };

    fetchRecords();
  }, [hasRole]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!records.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className="medical-records-page p-4">
      <h1 className="text-2xl font-bold">Medical Records</h1>
      <ul>
        {records.map(record => (
          <li key={record.id} className="mb-2">
            {record.patientName} - {record.description} ({record.date})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MedicalRecords;