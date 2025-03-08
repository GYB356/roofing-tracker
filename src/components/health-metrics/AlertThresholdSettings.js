import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function AlertThresholdSettings({ metricType, thresholds, onUpdate }) {
  const { authAxios } = useAuth();
  const [localThresholds, setLocalThresholds] = useState(thresholds);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  const handleChange = (path, value) => {
    const parts = path.split('.');
    setLocalThresholds(prev => ({
      ...prev,
      [parts[0]]: {
        ...prev[parts[0]],
        [parts[1]]: {
          ...prev[parts[0]][parts[1]],
          value: Number(value)
        }
      }
    }));
  };

  const validateThresholds = () => {
    for (const category of Object.values(localThresholds)) {
      for (const { min, max } of Object.values(category)) {
        if (min.value >= max.value) {
          setError('Minimum value must be less than maximum');
          return false;
        }
        if (min.value < 0 || max.value < 0) {
          setError('Values cannot be negative');
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    try {
      if (!validateThresholds()) return;

      await authAxios.post('/api/alert-thresholds', {
        metricType,
        thresholds: localThresholds
      });
      
      onUpdate(localThresholds);
      setSuccess('Thresholds updated successfully');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save thresholds. Please try again.');
      console.error('Save error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center space-x-1">
          <FiAlertTriangle className="text-yellow-500" />
          <span>Alert Thresholds</span>
        </h3>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
          aria-label="Save alert thresholds"
        >
          Save
        </button>
      </div>

      {Object.entries(localThresholds).map(([category, ranges]) => (
        <div key={category} className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-gray-700 capitalize">{category}</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ranges).map(([type, { value }]) => (
              <div key={type} className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 w-16">{type}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleChange(`${category}.${type}`, e.target.value)}
                  className="w-full px-2 py-1 border rounded-md text-sm"
                  aria-label={`${type} threshold`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="text-red-600 text-sm flex items-center space-x-1">
          <FiAlertTriangle />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="text-green-600 text-sm flex items-center space-x-1">
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}