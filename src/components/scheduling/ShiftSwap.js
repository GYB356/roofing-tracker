import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkConflict } from '../../utils/schedulingUtils';

const ShiftSwap = ({ department, shifts }) => {
  const { currentUser } = useAuth();
  const [swapRequests, setSwapRequests] = useState([]);
  const [newSwap, setNewSwap] = useState({
    originalShift: null,
    requestedShift: null,
    reason: '',
    status: 'pending'
  });
  const [availableShifts, setAvailableShifts] = useState([]);

  useEffect(() => {
    const loadSwapRequests = async () => {
      try {
        const response = await fetch(`/api/shift-swaps?department=${department.id}`);
        const data = await response.json();
        setSwapRequests(data.requests);
      } catch (error) {
        console.error('Error loading swap requests:', error);
      }
    };
    
    if (department) loadSwapRequests();
  }, [department]);

  const handleSubmitSwap = async (e) => {
    e.preventDefault();
    
    // Verify shift compatibility
    const conflictCheck = checkConflict(
      { 
        start: newSwap.requestedShift.start, 
        end: newSwap.requestedShift.end,
        staff: [currentUser]
      },
      shifts
    );

    if (conflictCheck.hasConflict) {
      alert('Selected shift conflicts with existing schedule');
      return;
    }

    try {
      const response = await fetch('/api/shift-swaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newSwap,
          requesterId: currentUser.id,
          departmentId: department.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSwapRequests([...swapRequests, data]);
        setNewSwap({
          originalShift: null,
          requestedShift: null,
          reason: '',
          status: 'pending'
        });
      }
    } catch (error) {
      console.error('Error submitting swap request:', error);
    }
  };

  const handleApproveSwap = async (swapId) => {
    try {
      const response = await fetch(`/api/shift-swaps/${swapId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSwapRequests(swapRequests.map(request =>
          request.id === swapId ? { ...request, status: 'approved' } : request
        ));
      }
    } catch (error) {
      console.error('Error approving swap:', error);
    }
  };

  return (
    <div className="shift-swaps bg-white rounded-lg shadow p-4 mt-4">
      <h3 className="text-lg font-semibold mb-4">Shift Swap Requests</h3>
      
      <form onSubmit={handleSubmitSwap} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Current Shift</label>
            <select
              value={newSwap.originalShift?.id || ''}
              onChange={(e) => setNewSwap({
                ...newSwap,
                originalShift: shifts.find(s => s.id === e.target.value)
              })}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Shift</option>
              {shifts.filter(s => s.staff.some(staff => staff.id === currentUser.id)).map(shift => (
                <option key={shift.id} value={shift.id}>
                  {new Date(shift.start).toLocaleString()} - {new Date(shift.end).toLocaleTimeString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Requested Shift</label>
            <select
              value={newSwap.requestedShift?.id || ''}
              onChange={(e) => setNewSwap({
                ...newSwap,
                requestedShift: shifts.find(s => s.id === e.target.value)
              })}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Shift</option>
              {shifts.filter(s => !s.staff.some(staff => staff.id === currentUser.id)).map(shift => (
                <option key={shift.id} value={shift.id}>
                  {new Date(shift.start).toLocaleString()} - {new Date(shift.end).toLocaleTimeString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Swap Reason</label>
          <textarea
            value={newSwap.reason}
            onChange={(e) => setNewSwap({...newSwap, reason: e.target.value})}
            className="w-full p-2 border rounded-md"
            rows="3"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Request Swap
        </button>
      </form>

      <div className="space-y-4">
        {swapRequests.map(request => (
          <div key={request.id} className="border rounded-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{request.requesterName}</p>
                <p className="text-gray-600">{request.reason}</p>
                <p className="text-sm text-gray-500">
                  {new Date(request.originalShift.start).toLocaleString()} → 
                  {new Date(request.requestedShift.start).toLocaleString()}
                </p>
              </div>
              {currentUser.role === 'manager' && request.status === 'pending' && (
                <button
                  onClick={() => handleApproveSwap(request.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Approve
                </button>
              )}
              <span className={`px-3 py-1 rounded-full text-sm ${
                request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                request.status === 'denied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {request.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftSwap;