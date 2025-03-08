import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiFileText, FiDollarSign, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import { HIPAAEncryptionService } from '../../utils/HIPAACompliance';

export default function InvoiceGenerator() {
  const { authAxios } = useAuth();
  const [formData, setFormData] = useState({
    serviceDate: '',
    description: '',
    hcpcsCode: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Encrypt sensitive billing data
      const encryptedData = HIPAAEncryptionService.encryptSensitiveData(formData);

      const response = await authAxios.post('/api/billing/create', {
        ...formData,
        encryptedData,
        amount: parseFloat(formData.amount) * 100 // Convert to cents
      });

      setSuccess('Invoice created successfully. Payment URL: ' + response.data.paymentUrl);
      setFormData({ serviceDate: '', description: '', hcpcsCode: '', amount: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
      console.error('Billing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center mb-4 space-x-2">
        <FiFileText className="text-blue-600" />
        <h3 className="text-lg font-semibold">New Service Invoice</h3>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex items-center">
            <FiFileText className="text-green-500 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <FiCalendar className="text-gray-400" />
            <input
              type="date"
              name="serviceDate"
              value={formData.serviceDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <FiFileText className="text-gray-400" />
            <input
              type="text"
              name="hcpcsCode"
              value={formData.hcpcsCode}
              onChange={handleChange}
              placeholder="HCPCS/CPT Code"
              className="w-full p-2 border rounded-md"
              required
              pattern="[A-Z0-9]{5}"
              title="5-character alphanumeric code"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <FiFileText className="text-gray-400" />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Service Description"
            className="w-full p-2 border rounded-md"
            rows="3"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <FiDollarSign className="text-gray-400" />
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Amount"
            className="w-full p-2 border rounded-md"
            step="0.01"
            min="0"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Generating Invoice...' : 'Create Invoice'}
        </button>
      </form>
    </div>
  );
}