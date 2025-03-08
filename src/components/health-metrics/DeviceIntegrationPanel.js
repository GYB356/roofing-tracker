import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiBluetooth, FiWifi, FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function DeviceIntegrationPanel({ deviceType, onSync }) {
  const { authAxios } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');

  const deviceConfig = {
    blood_pressure_monitor: {
      name: 'Blood Pressure Monitor',
      icon: <FiBluetooth className="w-5 h-5" />,
      connectionType: 'Bluetooth'
    },
    glucose_meter: {
      name: 'Glucose Meter',
      icon: <FiWifi className="w-5 h-5" />,
      connectionType: 'Wi-Fi'
    },
    heart_rate_monitor: {
      name: 'Heart Rate Monitor',
      icon: <FiBluetooth className="w-5 h-5" />,
      connectionType: 'Bluetooth'
    },
    smart_scale: {
      name: 'Smart Scale',
      icon: <FiBluetooth className="w-5 h-5" />,
      connectionType: 'Bluetooth'
    }
  };

  const handleConnect = async () => {
    try {
      setConnectionStatus('connecting');
      // Simulated device connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionStatus('connected');
      setError('');
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('Connection failed. Please ensure device is in range and powered on.');
    }
  };

  const handleSync = async () => {
    if (!deviceType) return;
    try {
      setIsSyncing(true);
      setError('');
      await onSync(deviceType);
    } catch (err) {
      setError('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Device Integration</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {deviceConfig[deviceType]?.icon}
          <span>{deviceConfig[deviceType]?.connectionType}</span>
        </div>
      </div>

      {deviceType ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' ? (
                <FiCheckCircle className="text-green-500" />
              ) : connectionStatus === 'connecting' ? (
                <FiRefreshCw className="animate-spin text-blue-500" />
              ) : (
                <FiAlertCircle className="text-gray-400" />
              )}
              <span>{deviceConfig[deviceType]?.name}</span>
            </div>
            <button
              onClick={handleConnect}
              className="px-3 py-1 text-sm rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
              disabled={connectionStatus === 'connecting'}
              aria-label={`Connect ${deviceConfig[deviceType]?.name}`}
            >
              {connectionStatus === 'connected' ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          <button
            onClick={handleSync}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={!deviceType || connectionStatus !== 'connected' || isSyncing}
            aria-label="Sync device data"
          >
            <FiRefreshCw className={`${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {error && (
            <div className="text-red-600 text-sm flex items-center space-x-1">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No device required for this metric</p>
      )}
    </div>
  );
}