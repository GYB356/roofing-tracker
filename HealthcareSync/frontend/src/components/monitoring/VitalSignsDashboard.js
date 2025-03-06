import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';

const VitalSignsDashboard = () => {
  const [vitalSigns, setVitalSigns] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [patientInfo, setPatientInfo] = useState({});
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!socket || !user) return;

    // Listen for vital sign updates
    socket.on('vitalSignUpdate', (data) => {
      setVitalSigns(prev => ({
        ...prev,
        [data.patientId]: {
          ...prev[data.patientId],
          [data.type]: {
            value: data.value,
            unit: data.unit,
            timestamp: data.timestamp,
            trend: prev[data.patientId]?.[data.type]?.value
              ? data.value > prev[data.patientId][data.type].value ? 'increasing' : 'decreasing'
              : 'stable'
          }
        }
      }));
    });

    // Listen for emergency alerts
    socket.on('emergencyAlert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 10));
      // Play alert sound for critical alerts
      if (alert.priority === 'high') {
        const audio = new Audio('/alert-sound.mp3');
        audio.play().catch(console.error);
      }
    });

    // Fetch patient information
    const fetchPatientInfo = async (patientId) => {
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        const data = await response.json();
        setPatientInfo(prev => ({ ...prev, [patientId]: data }));
      } catch (error) {
        console.error('Error fetching patient info:', error);
      }
    };

    return () => {
      socket.off('vitalSignUpdate');
      socket.off('emergencyAlert');
    };
  }, [socket, user]);

  const getVitalSignStatus = (type, value) => {
    const thresholds = {
      heart_rate: { min: 60, max: 100, critical_min: 50, critical_max: 120 },
      blood_pressure: { min: 90, max: 140, critical_min: 80, critical_max: 160 },
      oxygen_level: { min: 95, max: 100, critical_min: 90, critical_max: 100 },
      temperature: { min: 36.5, max: 37.5, critical_min: 35, critical_max: 39 }
    };

    const range = thresholds[type];
    if (!range) return { status: 'normal', severity: 'normal' };

    if (value < range.critical_min || value > range.critical_max) {
      return { status: value < range.critical_min ? 'critical-low' : 'critical-high', severity: 'critical' };
    }
    if (value < range.min || value > range.max) {
      return { status: value < range.min ? 'low' : 'high', severity: 'warning' };
    }
    return { status: 'normal', severity: 'normal' };
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return '↑';
      case 'decreasing':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Real-time Vital Signs Monitor</h2>
      
      {/* Alerts Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Recent Alerts</h3>
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className={`border-l-4 p-4 ${alert.priority === 'high' ? 'bg-red-100 border-red-500' : 'bg-yellow-100 border-yellow-500'}`}>
              <p className="font-bold">{alert.title}</p>
              <p>{alert.message}</p>
              <p className="text-sm text-gray-600">{new Date(alert.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vital Signs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(vitalSigns).map(([patientId, signs]) => {
          const patient = patientInfo[patientId] || {};
          return (
            <div key={patientId} className="border rounded-lg p-4 shadow">
              <div className="mb-3 border-b pb-2">
                <h4 className="font-semibold">Patient: {patient.name || `ID: ${patientId}`}</h4>
                {patient.age && <p className="text-sm text-gray-600">Age: {patient.age}</p>}
                {patient.roomNumber && <p className="text-sm text-gray-600">Room: {patient.roomNumber}</p>}
              </div>
              {Object.entries(signs).map(([type, data]) => {
                const { status, severity } = getVitalSignStatus(type, data.value);
                return (
                  <div
                    key={type}
                    className={`mb-2 p-2 rounded ${severity === 'critical' ? 'bg-red-100 animate-pulse' : 
                      severity === 'warning' ? 'bg-yellow-100' : 'bg-green-100'}`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{type.replace('_', ' ').toUpperCase()}</p>
                      <span className="text-gray-600">{getTrendIcon(data.trend)}</span>
                    </div>
                    <p className="text-lg font-bold">
                      {data.value} {data.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(data.timestamp).toLocaleTimeString()}
                    </p>
                    {severity !== 'normal' && (
                      <p className={`text-sm ${severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {status.replace('-', ' ').toUpperCase()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VitalSignsDashboard;