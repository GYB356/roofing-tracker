import React, { useState } from 'react';
import { AlertTriangle, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';

const EmergencyAlertSystem = () => {
  const { currentUser } = useAuth();
  const [alertType, setAlertType] = useState('medical');
  const [alertMessage, setAlertMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      // Call your emergency alert API
      const response = await fetch('/api/emergency/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: alertType,
          message: alertMessage,
          patientId: currentUser.id,
          location: 'Current location', // You could add geolocation here
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        alert('Emergency alert sent successfully');
        setAlertMessage('');
      } else {
        throw new Error('Failed to send alert');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      alert('Failed to send emergency alert. Please try another method or call 911.');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <AlertTriangle className="text-red-500 mr-2" size={24} />
        <h2 className="text-xl font-semibold">Emergency Alert System</h2>
      </div>
      
      <p className="text-gray-600 mb-4">
        Use this system to send an immediate alert to your healthcare team.
        For life-threatening emergencies, call 911 immediately.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Alert Type</label>
          <select
            value={alertType}
            onChange={(e) => setAlertType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="medical">Medical Emergency</option>
            <option value="medication">Medication Issue</option>
            <option value="assistance">Need Assistance</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Message</label>
          <textarea
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md h-24"
            placeholder="Describe your emergency situation..."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={sending}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium p-3 rounded-md disabled:bg-red-400"
        >
          {sending ? 'Sending Alert...' : 'Send Emergency Alert'}
        </button>
      </form>
    </div>
  );
};

export default EmergencyAlertSystem; 