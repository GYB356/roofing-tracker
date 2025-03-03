import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const DeviceIntegration = () => {
    const { user, hasRole } = useAuth();
    const { socket } = useSocket();
    const [devices, setDevices] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!hasRole(['doctor', 'nurse', 'admin'])) {
            setError('Access Denied');
            return;
        }

        // Fetch device data
        const fetchDevices = async () => {
            try {
                const response = await fetch('/api/devices');
                const data = await response.json();
                setDevices(data);
            } catch (err) {
                setError('Failed to load devices');
            }
        };

        fetchDevices();
    }, [hasRole]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!devices.length) {
        return <div>Loading...</div>;
    }

    return (
        <div className="device-integration-page p-4">
            <h1 className="text-2xl font-bold">Device Integration</h1>
            <ul>
                {devices.map(device => (
                    <li key={device.id} className="mb-2">
                        {device.name} - Status: {device.status}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DeviceIntegration; 