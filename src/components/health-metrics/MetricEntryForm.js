import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submitHealthMetric } from '../../services/healthMetricsService';

export default function MetricEntryForm({ metricType, unit, onSuccess }) {
  const { authAxios } = useAuth();
  const [value, setValue] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateInput = () => {
    if (!value) {
      setError('Please enter a value');
      return false;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      return false;
    }

    // Metric-specific validation
    switch(metricType) {
      case 'blood_pressure':
        if (!value.includes('/')) {
          setError('Enter blood pressure as systolic/diastolic (e.g. 120/80)');
          return false;
        }
        break;
      case 'medication_adherence':
        if (numValue < 0 || numValue > 100) {
          setError('Adherence must be between 0-100%');
          return false;
        }
        break;
      default:
        if (numValue <= 0) {
          setError('Value must be greater than 0');
          return false;
        }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateInput()) return;

    try {
      await submitHealthMetric(authAxios, {
        metricType,
        value: metricType === 'blood_pressure' ? value : parseFloat(value),
        timestamp
      });
      
      setSuccess('Entry added successfully');
      setValue('');
      onSuccess();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to submit entry. Please try again.');
      console.error('Submission error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Manual Entry</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value ({unit})
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label={`Enter ${metricType} value in ${unit}`}
            />
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time
            <input
              type="datetime-local"
              value={timestamp.slice(0, 16)}
              onChange={(e) => setTimestamp(e.target.value + ':00Z')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="Select entry timestamp"
            />
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Submit health metric entry"
        >
          Add Entry
        </button>
      </form>
    </div>
  );
}