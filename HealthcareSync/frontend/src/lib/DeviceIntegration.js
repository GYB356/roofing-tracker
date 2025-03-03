import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const DeviceIntegration = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [deviceData, setDeviceData] = useState(null);
    const [deviceStatus, setDeviceStatus] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '',
        type: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        location: '',
        department: ''
    });
    
    const { user } = useAuth();
    const socket = useSocket();
    
    // Device types
    const deviceTypes = [
        { id: 'monitor', name: 'Patient Monitor' },
        { id: 'ventilator', name: 'Ventilator' },
        { id: 'infusion_pump', name: 'Infusion Pump' },
        { id: 'ecg', name: 'ECG Machine' },
        { id: 'ultrasound', name: 'Ultrasound' },
        { id: 'xray', name: 'X-Ray Machine' },
        { id: 'mri', name: 'MRI Scanner' },
        { id: 'ct', name: 'CT Scanner' }
    ];
    
    // Departments
    const departments = [
        { id: 'emergency', name: 'Emergency' },
        { id: 'cardiology', name: 'Cardiology' },
        { id: 'neurology', name: 'Neurology' },
        { id: 'pediatrics', name: 'Pediatrics' },
        { id: 'oncology', name: 'Oncology' },
        { id: 'radiology', name: 'Radiology' },
        { id: 'icu', name: 'Intensive Care Unit' }
    ];
    
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setLoading(true);
                // API call would go here
                const response = await fetch('/api/devices');
                const data = await response.json();
                
                if (response.ok) {
                    setDevices(data);
                    
                    // Initialize device status
                    const statusObj = {};
                    data.forEach(device => {
                        statusObj[device.id] = device.status || 'offline';
                    });
                    setDeviceStatus(statusObj);
                } else {
                    throw new Error(data.message || 'Failed to fetch devices');
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching devices:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDevices();
    }, []);
    
    useEffect(() => {
        if (socket) {
            // Listen for device status updates
            socket.on('device_status_update', (data) => {
                setDeviceStatus(prev => ({
                    ...prev,
                    [data.deviceId]: data.status
                }));
                
                // If this is the selected device, update its data
                if (selectedDevice && selectedDevice.id === data.deviceId && data.readings) {
                    setDeviceData(data.readings);
                }
            });
            
            return () => {
                socket.off('device_status_update');
            };
        }
    }, [socket, selectedDevice]);
    
    const handleDeviceSelect = async (device) => {
        setSelectedDevice(device);
        
        try {
            // API call to get device data
            const response = await fetch(`/api/devices/${device.id}/data`);
            const data = await response.json();
            
            if (response.ok) {
                setDeviceData(data);
            } else {
                throw new Error(data.message || 'Failed to fetch device data');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching device data:', err);
        }
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAddForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // API call would go here
            const response = await fetch('/api/devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addForm)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setDevices(prev => [...prev, data]);
                setDeviceStatus(prev => ({
                    ...prev,
                    [data.id]: 'offline'
                }));
                setShowAddModal(false);
                // Reset form
                setAddForm({
                    name: '',
                    type: '',
                    manufacturer: '',
                    model: '',
                    serialNumber: '',
                    location: '',
                    department: ''
                });
            } else {
                throw new Error(data.message || 'Failed to add device');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error adding device:', err);
        }
    };
    
    const handleDeviceAction = async (deviceId, action) => {
        try {
            // API call would go here
            const response = await fetch(`/api/devices/${deviceId}/${action}`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Update device status
                setDeviceStatus(prev => ({
                    ...prev,
                    [deviceId]: action === 'connect' ? 'connecting' : 'disconnecting'
                }));
                
                // In a real implementation, the actual status change would come from the WebSocket
                setTimeout(() => {
                    setDeviceStatus(prev => ({
                        ...prev,
                        [deviceId]: action === 'connect' ? 'online' : 'offline'
                    }));
                }, 2000);
            } else {
                throw new Error(data.message || `Failed to ${action} device`);
            }
        } catch (err) {
            setError(err.message);
            console.error(`Error ${action}ing device:`, err);
        }
    };
    
    // Mock data for demonstration
    const mockDevices = [
        {
            id: '1',
            name: 'ICU Patient Monitor 1',
            type: 'monitor',
            manufacturer: 'Philips',
            model: 'IntelliVue MX750',
            serialNumber: 'PM12345678',
            location: 'ICU Room 101',
            department: 'icu',
            lastMaintenance: '2023-09-15',
            nextMaintenance: '2024-03-15'
        },
        {
            id: '2',
            name: 'Cardiology Ultrasound',
            type: 'ultrasound',
            manufacturer: 'GE Healthcare',
            model: 'Vivid E95',
            serialNumber: 'US87654321',
            location: 'Cardiology Lab 2',
            department: 'cardiology',
            lastMaintenance: '2023-10-22',
            nextMaintenance: '2024-04-22'
        },
        {
            id: '3',
            name: 'Emergency Ventilator 3',
            type: 'ventilator',
            manufacturer: 'Medtronic',
            model: 'Puritan Bennett 980',
            serialNumber: 'VT24681357',
            location: 'Emergency Room 5',
            department: 'emergency',
            lastMaintenance: '2023-11-05',
            nextMaintenance: '2024-05-05'
        },
        {
            id: '4',
            name: 'Radiology MRI Scanner',
            type: 'mri',
            manufacturer: 'Siemens Healthineers',
            model: 'MAGNETOM Vida',
            serialNumber: 'MR13579246',
            location: 'Radiology Suite B',
            department: 'radiology',
            lastMaintenance: '2023-08-10',
            nextMaintenance: '2024-02-10'
        }
    ];
    
    // Mock device status
    const mockDeviceStatus = {
        '1': 'online',
        '2': 'offline',
        '3': 'online',
        '4': 'maintenance'
    };
    
    // Mock device data for patient monitor
    const mockMonitorData = {
        heartRate: {
            current: 78,
            min: 65,
            max: 85,
            unit: 'bpm',
            history: [75, 76, 78, 77, 79, 80, 78, 77, 76, 78]
        },
        bloodPressure: {
            systolic: 120,
            diastolic: 80,
            unit: 'mmHg',
            history: [
                { systolic: 118, diastolic: 78 },
                { systolic: 119, diastolic: 79 },
                { systolic: 120, diastolic: 80 },
                { systolic: 122, diastolic: 81 },
                { systolic: 121, diastolic: 80 }
            ]
        },
        oxygenSaturation: {
            current: 98,
            min: 95,
            max: 100,
            unit: '%',
            history: [97, 98, 98, 99, 98, 97, 98, 98, 99, 98]
        },
        temperature: {
            current: 37.1,
            min: 36.5,
            max: 37.5,
            unit: '°C',
            history: [37.0, 37.1, 37.1, 37.2, 37.1, 37.0, 37.1, 37.1, 37.2, 37.1]
        },
        respiratoryRate: {
            current: 16,
            min: 12,
            max: 20,
            unit: 'breaths/min',
            history: [15, 16, 16, 17, 16, 15, 16, 16, 17, 16]
        }
    };
    
    if (loading) return <div className="flex justify-center items-center h-64"><p>Loading devices...</p></div>;
    
    // Use mock data if no devices are fetched
    const displayDevices = devices.length > 0 ? devices : mockDevices;
    const displayDeviceStatus = Object.keys(deviceStatus).length > 0 ? deviceStatus : mockDeviceStatus;
    
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Medical Device Integration</h1>
            
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                    {error}
                    <button 
                        className="ml-2 text-red-700 hover:text-red-900"
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}
            
            <div className="flex justify-end mb-6">
                {user && (user.role === 'admin' || user.role === 'technician') && (
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add New Device
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded shadow overflow-hidden">
                        <div className="bg-gray-100 p-4 border-b">
                            <h2 className="text-lg font-semibold">Connected Devices</h2>
                        </div>
                        <div className="divide-y">
                            {displayDevices.map((device) => (
                                <div 
                                    key={device.id} 
                                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedDevice && selectedDevice.id === device.id ? 'bg-blue-50' : ''}`}
                                    onClick={() => handleDeviceSelect(device)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium">{device.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                {deviceTypes.find(t => t.id === device.type)?.name || device.type} | 
                                                {departments.find(d => d.id === device.department)?.name || device.department}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                                displayDeviceStatus[device.id] === 'online' ? 'bg-green-500' : 
                                                displayDeviceStatus[device.id] === 'offline' ? 'bg-gray-500' : 
                                                displayDeviceStatus[device.id] === 'maintenance' ? 'bg-yellow-500' : 
                                                displayDeviceStatus[device.id] === 'error' ? 'bg-red-500' : 
                                                'bg-blue-500' // connecting or disconnecting
                                            }`}></span>
                                            <span className="text-sm capitalize">{displayDeviceStatus[device.id]}</span>
                                        </div>
                                    </div>
                                    
                                    {user && (user.role === 'admin' || user.role === 'technician' || user.role === 'doctor') && (
                                        <div className="mt-2 flex justify-end space-x-2">
                                            {displayDeviceStatus[device.id] === 'offline' ? (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeviceAction(device.id, 'connect');
                                                    }}
                                                    className="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                                    disabled={displayDeviceStatus[device.id] === 'connecting'}
                                                >
                                                    Connect
                                                </button>
                                            ) : displayDeviceStatus[device.id] === 'online' ? (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeviceAction(device.id, 'disconnect');
                                                    }}
                                                    className="text-sm bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                                                    disabled={displayDeviceStatus[device.id] === 'disconnecting'}
                                                >
                                                    Disconnect
                                                </button>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-2">
                    {selectedDevice ? (
                        <div className="bg-white rounded shadow">
                            <div className="bg-gray-100 p-4 border-b">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">{selectedDevice.name}</h2>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        displayDeviceStatus[selectedDevice.id] === 'online' ? 'bg-green-100 text-green-800' : 
                                        displayDeviceStatus[selectedDevice.id] === 'offline' ? 'bg-gray-100 text-gray-800' : 
                                        displayDeviceStatus[selectedDevice.id] === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                                        displayDeviceStatus[selectedDevice.id] === 'error' ? 'bg-red-100 text-red-800' : 
                                        'bg-blue-100 text-blue-800' // connecting or disconnecting
                                    }`}>
                                        <span className={`w-2 h-2 mr-1 rounded-full ${
                                            displayDeviceStatus[selectedDevice.id] === 'online' ? 'bg-green-500' : 
                                            displayDeviceStatus[selectedDevice.id] === 'offline' ? 'bg-gray-500' : 
                                            displayDeviceStatus[selectedDevice.id] === 'maintenance' ? 'bg-yellow-500' : 
                                            displayDeviceStatus[selectedDevice.id] === 'error' ? 'bg-red-500' : 
                                            'bg-blue-500' // connecting or disconnecting
                                        }`}></span>
                                        <span className="capitalize">{displayDeviceStatus[selectedDevice.id]}</span>
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Device Information</h3>
                                        <div className="mt-2 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Type:</span>
                                                <span className="text-sm font-medium">{deviceTypes.find(t => t.id === selectedDevice.type)?.name || selectedDevice.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Manufacturer:</span>
                                                <span className="text-sm font-medium">{selectedDevice.manufacturer}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Model:</span>
                                                <span className="text-sm font-medium">{selectedDevice.model}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Serial Number:</span>
                                                <span className="text-sm font-medium">{selectedDevice.serialNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Location Information</h3>
                                        <div className="mt-2 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Location:</span>
                                                <span className="text-sm font-medium">{selectedDevice.location}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Department:</span>
                                                <span className="text-sm font-medium">{departments.find(d => d.id === selectedDevice.department)?.name || selectedDevice.department}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Last Maintenance:</span>
                                                <span className="text-sm font-medium">{selectedDevice.lastMaintenance}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Next Maintenance:</span>
                                                <span className="text-sm font-medium">{selectedDevice.nextMaintenance}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {displayDeviceStatus[selectedDevice.id] === 'online' && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-4">Device Data</h3>
                                        
                                        {selectedDevice.type === 'monitor' && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Use mock data for demonstration */}
                                                {Object.entries(deviceData || mockMonitorData).map(([key, value]) => {
                                                    if (key === 'bloodPressure') {
                                                        return (
                                                            <div key={key} className="bg-gray-50 p-4 rounded">
                                                                <h4 className="text-sm font-medium capitalize">Blood Pressure</h4>
                                                                <div className="mt-2 flex items-end space-x-2">
                                                                    <span className="text-2xl font-bold">{value.systolic}/{value.diastolic}</span>
                                                                    <span className="text-sm text-gray-600">{value.unit}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <div key={key} className="bg-gray-50 p-4 rounded">
                                                            <h4 className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                            <div className="mt-2 flex items-end space-x-2">
                                                                <span className="text-2xl font-bold">{value.current}</span>
                                                                <span className="text-sm text-gray-600">{value.unit}</span>
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                Range: {value.min} - {value.max} {value.unit}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        
                                        {selectedDevice.type !== 'monitor' && (
                                            <div className="bg-gray-50 p-4 rounded">
                                                <p className="text-center text-gray-600">Data visualization for {deviceTypes.find(t => t.id === selectedDevice.type)?.name || selectedDevice.type} would be displayed here.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {displayDeviceStatus[selectedDevice.id] !== 'online' && (
                                    <div className="bg-gray-50 p-8 rounded text-center">
                                        <p className="text-gray-600">Device is currently {displayDeviceStatus[selectedDevice.id]}. Connect the device to view data.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded shadow p-8 text-center">
                            <p className="text-gray-600">Select a device to view details and data.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Add Device Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Add New Device</h2>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Device Name</label>
                                <input 
                                    type="text"
                                    name="name"
                                    value={addForm.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Device Type</label>
                                <select 
                                    name="type"
                                    value={addForm.type}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {deviceTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Manufacturer</label>
                                <input 
                                    type="text"
                                    name="manufacturer"
                                    value={addForm.manufacturer}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Model</label>
                                <input 
                                    type="text"
                                    name="model"
                                    value={addForm.model}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Serial Number</label>
                                <input 
                                    type="text"
                                    name="serialNumber"
                                    value={addForm.serialNumber}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Location</label>
                                <input 
                                    type="text"
                                    name="location"
                                    value={addForm.location}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Department</label>
                                <select 
                                    name="department"
                                    value={addForm.department}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Add Device
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceIntegration; 