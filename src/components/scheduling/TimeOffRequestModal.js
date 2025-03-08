import React, { useState } from 'react';

export default function TimeOffRequestModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation',
    reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/time-off', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSubmit(await response.json());
        onClose();
      }
    } catch (error) {
      console.error('Error submitting time-off request:', error);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content bg-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Request Time Off</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2">Start Date</label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block mb-2">End Date</label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Request Type</label>
            <select
              className="w-full p-2 border rounded"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2">Reason</label>
            <textarea
              className="w-full p-2 border rounded"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              rows="3"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border rounded hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}