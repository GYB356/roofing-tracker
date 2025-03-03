import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Telemedicine = () => {
    const [schedules, setSchedules] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAddShiftModal, setShowAddShiftModal] = useState(false);
    const [showEditShiftModal, setShowEditShiftModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [shiftForm, setShiftForm] = useState({
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        department: 'general',
        notes: ''
    });
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStaff, setFilterStaff] = useState('all');
    
    const { user } = useAuth();
    const socket = useSocket();
    
    // Fetch schedules and staff
    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/scheduling/shifts?date=${selectedDate}`);
                const data = await response.json();
                
                if (response.ok) {
                    setSchedules(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch schedules');
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching schedules:', err);
            } finally {
                setLoading(false);
            }
        };
        
        const fetchStaff = async () => {
            try {
                const response = await fetch('/api/users/staff');
                const data = await response.json();
                
                if (response.ok) {
                    setStaff(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch staff');
                }
            } catch (err) {
                console.error('Error fetching staff:', err);
            }
        };
        
        fetchSchedules();
        fetchStaff();
        
        // Socket event listeners
        socket.on('shiftCreated', (newShift) => {
            if (newShift.date === selectedDate) {
                setSchedules(prev => [...prev, newShift]);
            }
        });
        
        socket.on('shiftUpdated', (updatedShift) => {
            setSchedules(prev => 
                prev.map(shift => shift.id === updatedShift.id ? updatedShift : shift)
            );
        });
        
        socket.on('shiftDeleted', (shiftId) => {
            setSchedules(prev => prev.filter(shift => shift.id !== shiftId));
        });
        
        return () => {
            socket.off('shiftCreated');
            socket.off('shiftUpdated');
            socket.off('shiftDeleted');
        };
    }, [socket, selectedDate]);
    
    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShiftForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Handle date change
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };
    
    // Handle department filter change
    const handleDepartmentFilterChange = (e) => {
        setFilterDepartment(e.target.value);
    };
    
    // Handle staff filter change
    const handleStaffFilterChange = (e) => {
        setFilterStaff(e.target.value);
    };
    
    // Add new shift
    const handleAddShift = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/scheduling/shifts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shiftForm)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (data.date === selectedDate) {
                    setSchedules(prev => [...prev, data]);
                }
                setShowAddShiftModal(false);
                setShiftForm({
                    staffId: '',
                    date: selectedDate,
                    startTime: '09:00',
                    endTime: '17:00',
                    department: 'general',
                    notes: ''
                });
                
                logHIPAAEvent(`Added shift for staff ${data.staffId} on ${data.date}`);
            } else {
                throw new Error(data.message || 'Failed to add shift');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error adding shift:', err);
        }
    };
    
    // Edit shift
    const handleEditShift = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(`/api/scheduling/shifts/${selectedShift.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shiftForm)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSchedules(prev => 
                    prev.map(shift => shift.id === selectedShift.id ? data : shift)
                );
                setShowEditShiftModal(false);
                setSelectedShift(null);
                
                logHIPAAEvent(`Updated shift ${data.id} for staff ${data.staffId}`);
            } else {
                throw new Error(data.message || 'Failed to update shift');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error updating shift:', err);
        }
    };
    
    // Delete shift
    const handleDeleteShift = async (shiftId) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/scheduling/shifts/${shiftId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setSchedules(prev => prev.filter(shift => shift.id !== shiftId));
                
                if (selectedShift && selectedShift.id === shiftId) {
                    setShowEditShiftModal(false);
                    setSelectedShift(null);
                }
                
                logHIPAAEvent(`Deleted shift ${shiftId}`);
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete shift');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error deleting shift:', err);
        }
    };
    
    // Open edit modal
    const handleEditClick = (shift) => {
        setSelectedShift(shift);
        setShiftForm({
            staffId: shift.staffId,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            department: shift.department,
            notes: shift.notes || ''
        });
        setShowEditShiftModal(true);
    };
    
    // HIPAA logging
    const logHIPAAEvent = (event) => {
        console.log(`HIPAA Log: ${event}`);
        // In a production environment, this would be sent to a secure logging service
    };
    
    // Filter schedules based on department and staff
    const filteredSchedules = schedules.filter(schedule => {
        if (filterDepartment !== 'all' && schedule.department !== filterDepartment) {
            return false;
        }
        
        if (filterStaff !== 'all' && schedule.staffId !== filterStaff) {
            return false;
        }
        
        return true;
    });
    
    // Get staff name by ID
    const getStaffName = (staffId) => {
        const staffMember = staff.find(s => s.id === staffId);
        return staffMember ? staffMember.name : 'Unknown';
    };
    
    // Format time (24h to 12h)
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };
    
    // Calculate shift duration
    const calculateDuration = (startTime, endTime) => {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diff = (end - start) / (1000 * 60 * 60); // hours
        return diff.toFixed(1);
    };
    
    if (loading) return <div className="flex justify-center items-center h-64"><p>Loading schedules...</p></div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
    
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Staff Scheduling</h1>
            
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div>
                        <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            id="selectedDate"
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="p-2 border rounded w-full md:w-auto"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="filterDepartment" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                            id="filterDepartment"
                            value={filterDepartment}
                            onChange={handleDepartmentFilterChange}
                            className="p-2 border rounded w-full md:w-auto"
                        >
                            <option value="all">All Departments</option>
                            <option value="general">General</option>
                            <option value="emergency">Emergency</option>
                            <option value="pediatrics">Pediatrics</option>
                            <option value="cardiology">Cardiology</option>
                            <option value="neurology">Neurology</option>
                            <option value="orthopedics">Orthopedics</option>
                            <option value="radiology">Radiology</option>
                            <option value="laboratory">Laboratory</option>
                            <option value="pharmacy">Pharmacy</option>
                            <option value="administration">Administration</option>
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="filterStaff" className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                        <select
                            id="filterStaff"
                            value={filterStaff}
                            onChange={handleStaffFilterChange}
                            className="p-2 border rounded w-full md:w-auto"
                        >
                            <option value="all">All Staff</option>
                            {staff.map(staffMember => (
                                <option key={staffMember.id} value={staffMember.id}>
                                    {staffMember.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {(user?.role === 'admin' || user?.role === 'staff') && (
                    <button
                        onClick={() => {
                            setShiftForm({
                                staffId: '',
                                date: selectedDate,
                                startTime: '09:00',
                                endTime: '17:00',
                                department: 'general',
                                notes: ''
                            });
                            setShowAddShiftModal(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4 md:mt-0"
                    >
                        Add Shift
                    </button>
                )}
            </div>
            
            {filteredSchedules.length > 0 ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Staff
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Department
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Start Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    End Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSchedules.map((schedule) => (
                                <tr key={schedule.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {getStaffName(schedule.staffId)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                        {schedule.department}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatTime(schedule.startTime)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatTime(schedule.endTime)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {calculateDuration(schedule.startTime, schedule.endTime)} hrs
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(user?.role === 'admin' || user?.role === 'staff') && (
                                            <>
                                                <button 
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                    onClick={() => handleEditClick(schedule)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="text-red-600 hover:text-red-900"
                                                    onClick={() => handleDeleteShift(schedule.id)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <p className="text-gray-500">No shifts scheduled for this date.</p>
                </div>
            )}
            
            {/* Add Shift Modal */}
            {showAddShiftModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold mb-4">Schedule New Appointment</h2>
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreateSubmit} className="mt-4">
                                {user.role === 'patient' ? (
                                    <input
                                        type="hidden"
                                        name="patientId"
                                        value={user.id}
                                    />
                                ) : (
                                    <div className="mb-4">
                                        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                                            Patient ID
                                        </label>
                                        <input
                                            type="text"
                                            id="patientId"
                                            name="patientId"
                                            value={appointmentForm.patientId}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                            required
                                        />
                                    </div>
                                )}
                                
                                {user.role === 'patient' ? (
                                    <input
                                        type="hidden"
                                        name="patientName"
                                        value={user.name}
                                    />
                                ) : (
                                    <div className="mb-4">
                                        <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Patient Name
                                        </label>
                                        <input
                                            type="text"
                                            id="patientName"
                                            name="patientName"
                                            value={appointmentForm.patientName}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                            required
                                        />
                                    </div>
                                )}
                                
                                {user.role === 'doctor' ? (
                                    <>
                                        <input
                                            type="hidden"
                                            name="doctorId"
                                            value={user.id}
                                        />
                                        <input
                                            type="hidden"
                                            name="doctorName"
                                            value={user.name}
                                        />
                                    </>
                                ) : (
                                    <div className="mb-4">
                                        <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">
                                            Doctor
                                        </label>
                                        <select
                                            id="doctorId"
                                            name="doctorId"
                                            value={appointmentForm.doctorId}
                                            onChange={handleDoctorChange}
                                            className="w-full p-2 border rounded"
                                            required
                                        >
                                            <option value="">Select a doctor</option>
                                            {availableDoctors.map(doctor => (
                                                <option key={doctor.id} value={doctor.id}>
                                                    {doctor.name} - {doctor.specialty}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            id="date"
                                            name="date"
                                            value={appointmentForm.date}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            id="time"
                                            name="time"
                                            value={appointmentForm.time}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                                        Duration (minutes)
                                    </label>
                                    <select
                                        id="duration"
                                        name="duration"
                                        value={appointmentForm.duration}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                        required
                                    >
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="45">45 minutes</option>
                                        <option value="60">60 minutes</option>
                                    </select>
                                </div>
                                
                                <div className="mb-4">
                                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for Visit
                                    </label>
                                    <input
                                        type="text"
                                        id="reason"
                                        name="reason"
                                        value={appointmentForm.reason}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={appointmentForm.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full p-2 border rounded"
                                    ></textarea>
                                </div>
                                
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    >
                                        Schedule Appointment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Telemedicine; 