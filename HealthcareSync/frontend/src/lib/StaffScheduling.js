import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const StaffScheduling = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [scheduleForm, setScheduleForm] = useState({
        staffId: '',
        startTime: '',
        endTime: '',
        department: '',
        notes: ''
    });
    
    const { user } = useAuth();
    
    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                setLoading(true);
                // API call would go here
                const response = await fetch('/api/schedules');
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
        
        fetchSchedules();
    }, []);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setScheduleForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // API call would go here
            const response = await fetch('/api/schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scheduleForm)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setSchedules(prev => [...prev, data]);
                // Reset form
                setScheduleForm({
                    staffId: '',
                    startTime: '',
                    endTime: '',
                    department: '',
                    notes: ''
                });
            } else {
                throw new Error(data.message || 'Failed to create schedule');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error creating schedule:', err);
        }
    };
    
    const handleDateChange = (date) => {
        setSelectedDate(date);
        // Filter schedules based on selected date
    };
    
    const handleStaffSelect = (staffId) => {
        setSelectedStaff(staffId);
        // Filter schedules based on selected staff
    };
    
    if (loading) return <div className="flex justify-center items-center h-64"><p>Loading schedules...</p></div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
    
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Staff Scheduling</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Create Schedule</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Staff Member</label>
                            <select 
                                name="staffId" 
                                value={scheduleForm.staffId}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select Staff Member</option>
                                {/* Map through staff members */}
                            </select>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Start Time</label>
                            <input 
                                type="datetime-local" 
                                name="startTime"
                                value={scheduleForm.startTime}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">End Time</label>
                            <input 
                                type="datetime-local" 
                                name="endTime"
                                value={scheduleForm.endTime}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Department</label>
                            <select 
                                name="department" 
                                value={scheduleForm.department}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="emergency">Emergency</option>
                                <option value="cardiology">Cardiology</option>
                                <option value="neurology">Neurology</option>
                                <option value="pediatrics">Pediatrics</option>
                                <option value="oncology">Oncology</option>
                            </select>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea 
                                name="notes"
                                value={scheduleForm.notes}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                rows="3"
                            ></textarea>
                        </div>
                        
                        <button 
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Create Schedule
                        </button>
                    </form>
                </div>
                
                <div className="bg-white p-4 rounded shadow md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Schedule Calendar</h2>
                    <div className="flex justify-between mb-4">
                        <div>
                            {/* Date picker would go here */}
                            <input 
                                type="date" 
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={(e) => handleDateChange(new Date(e.target.value))}
                                className="p-2 border rounded"
                            />
                        </div>
                        <div>
                            <select 
                                value={selectedStaff || ''}
                                onChange={(e) => handleStaffSelect(e.target.value)}
                                className="p-2 border rounded"
                            >
                                <option value="">All Staff</option>
                                {/* Map through staff members */}
                            </select>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-4 border-b text-left">Staff</th>
                                    <th className="py-2 px-4 border-b text-left">Department</th>
                                    <th className="py-2 px-4 border-b text-left">Start Time</th>
                                    <th className="py-2 px-4 border-b text-left">End Time</th>
                                    <th className="py-2 px-4 border-b text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.length > 0 ? (
                                    schedules.map((schedule) => (
                                        <tr key={schedule.id} className="hover:bg-gray-50">
                                            <td className="py-2 px-4 border-b">{schedule.staffName}</td>
                                            <td className="py-2 px-4 border-b">{schedule.department}</td>
                                            <td className="py-2 px-4 border-b">{new Date(schedule.startTime).toLocaleString()}</td>
                                            <td className="py-2 px-4 border-b">{new Date(schedule.endTime).toLocaleString()}</td>
                                            <td className="py-2 px-4 border-b">
                                                <button className="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                                                <button className="text-red-500 hover:text-red-700">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-4 text-center">No schedules found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffScheduling; 