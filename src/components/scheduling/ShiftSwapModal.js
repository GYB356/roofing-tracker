import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ShiftSwapModal = ({ shift, onClose, onComplete }) => {
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [message, setMessage] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchAvailableStaff = async () => {
      try {
        const response = await fetch(`/api/staff/available?shiftId=${shift.id}`);
        const data = await response.json();
        setAvailableStaff(data.staff);
      } catch (error) {
        console.error('Error fetching available staff:', error);
      }
    };
    
    if (shift) fetchAvailableStaff();
  }, [shift]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/shifts/${shift.id}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestedStaffId: selectedStaff,
          message,
          requesterId: currentUser.id
        })
      });

      if (response.ok) {
        onComplete();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting shift swap:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Request Shift Swap</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Available Staff:
              <select
                className="w-full p-2 border rounded"
                value={selectedStaff || ''}
                onChange={(e) => setSelectedStaff(e.target.value)}
                required
              >
                <option value="">Select staff member</option>
                {availableStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.roles.join(', ')})
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Message:
              <textarea
                className="w-full p-2 border rounded"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add optional message..."
                rows="3"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Request Swap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftSwapModal;