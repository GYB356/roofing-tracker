import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Telemedicine = () => {
  const { user, hasRole } = useAuth();
  const { socket, joinTelemedicineSession, leaveTelemedicineSession } = useSocket();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasRole(['doctor', 'nurse', 'admin'])) {
      setError('Access Denied');
      return;
    }

    // Fetch telemedicine session data
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/telemedicine/sessions');
        const data = await response.json();
        setSession(data);
      } catch (err) {
        setError('Failed to load session');
      }
    };

    fetchSession();

    return () => {
      if (session) {
        leaveTelemedicineSession(session.id);
      }
    };
  }, [hasRole, leaveTelemedicineSession, session]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="telemedicine-page p-4">
      <h1 className="text-2xl font-bold">Telemedicine Session</h1>
      <p>Session ID: {session.id}</p>
      <button onClick={() => joinTelemedicineSession(session.id)} className="btn btn-primary mt-4">Join Session</button>
    </div>
  );
};

export default Telemedicine;