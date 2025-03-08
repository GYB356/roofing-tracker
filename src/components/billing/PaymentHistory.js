import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiDollarSign, FiDownload, FiAlertCircle } from 'react-icons/fi';

export default function PaymentHistory() {
  const { authAxios } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await authAxios.get('/api/billing/history');
        setTransactions(response.data);
      } catch (err) {
        setError('Failed to load payment history');
        console.error('Billing history error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Convert cents to dollars
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center mb-4 space-x-2">
        <FiDollarSign className="text-green-600" />
        <h3 className="text-lg font-semibold">Payment History</h3>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.status === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <button
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                    onClick={() => window.open(`/api/billing/invoice/${transaction.id}`, '_blank')}
                  >
                    <FiDownload className="mr-1" />
                    Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
