import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkConflict } from '../../utils/schedulingUtils';

const TimeOffRequests = ({ department, shifts }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({
    start: '',
    end: '',
    reason: '',
    type: 'vacation'
  });
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await fetch(`/api/time-off?department=${department.id}`);
        const data = await response.json();
        setRequests(data.requests);
      } catch (error) {
        console.error('Error loading time-off requests:', error);
      }
    };
    
    if (department) loadRequests();
  }, [department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for scheduling conflicts
    const conflictCheck = checkConflict(
      { start: newRequest.start, end: newRequest.end },
      shifts
    );

    if (conflictCheck.hasConflict) {
      setConflicts(conflictCheck.conflicts);
      return;
    }

    try {
      const response = await fetch('/api/time-off', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newRequest,
          staffId: currentUser.id,
          departmentId: department.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRequests([...requests, data]);
        setNewRequest({ start: '', end: '', reason: '', type: 'vacation' });
        setConflicts([]);
      }
    } catch (error) {
      console.error('Error submitting time-off request:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="time-off-requests bg-white rounded-lg shadow p-4 mt-4">
      <h3 className="text-lg font-semibold mb-4">Time Off Requests</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={newRequest.start}
              onChange={(e) => setNewRequest({...newRequest, start: e.target.value})}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="datetime-local"
              value={newRequest.end}
              onChange={(e) => setNewRequest({...newRequest, end: e.target.value})}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Reason</label>
          <textarea
            value={newRequest.reason}
            onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
            className="w-full p-2 border rounded-md"
            rows="3"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={newRequest.type}
            onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}
            className="w-full p-2 border rounded-md"
          >
            <option value="vacation">Vacation</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        
        {conflicts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <h4 className="font-medium text-red-700">Scheduling Conflicts Detected:</h4>
            <ul className="list-disc pl-6 mt-2">
              {conflicts.map((conflict, index) => (
                <li key={index} className="text-red-600">
                  {conflict.type === 'overlap' 
                    ? `Overlap with shift on ${new Date(conflict.existingShift.start).toLocaleDateString()}`
                    : 'Role coverage conflict'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Request
        </button>
      </form>

      <div className="space-y-4">
        {requests.map(request => (
          <div key={request.id} className="border rounded-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {new Date(request.start).toLocaleDateString()} - 
                  {new Date(request.end).toLocaleDateString()}
                </p>
                <p className="text-gray-600">{request.reason}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeOffRequests;