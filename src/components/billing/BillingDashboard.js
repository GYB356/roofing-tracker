import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiDollarSign, FiTrendingUp, FiDownload, FiAlertCircle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BillingDashboard() {
  const { authAxios } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const [metricsRes, transactionsRes] = await Promise.all([
          authAxios.get('/api/billing/metrics'),
          authAxios.get('/api/billing/recent')
        ]);
        
        setMetrics(metricsRes.data);
        setTransactions(transactionsRes.data);
        setError('');
      } catch (err) {
        setError('Failed to load billing data');
        console.error('Billing dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <FiDollarSign className="text-green-600" />
          <span>Billing Dashboard</span>
        </h2>
        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => window.open('/api/billing/export', '_blank')}
        >
          <FiDownload className="mr-2" />
          Export Report
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <FiDollarSign className="text-green-600" />
            <h3 className="font-medium">Total Revenue</h3>
          </div>
          <p className="text-2xl mt-2">{formatCurrency(metrics?.totalRevenue)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <FiTrendingUp className="text-blue-600" />
            <h3 className="font-medium">Pending Payments</h3>
          </div>
          <p className="text-2xl mt-2">{formatCurrency(metrics?.pendingAmount)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="text-yellow-600" />
            <h3 className="font-medium">Overdue Invoices</h3>
          </div>
          <p className="text-2xl mt-2">{metrics?.overdueCount}</p>
        </div>
      </div>

      <div className="h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics?.revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={value => `$${value / 100}`} />
            <Tooltip formatter={value => [formatCurrency(value), 'Revenue']} />
            <Bar dataKey="amount" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{transaction.patientName}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.status === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}