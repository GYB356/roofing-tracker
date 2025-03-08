import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiClock, FiSend, FiAlertCircle } from 'react-icons/fi';
import { AuditService } from '../../services/AuditService';
import { HIPAAEncryptionService } from '../../utils/HIPAACompliance';

export default function AutomatedReminders() {
  const { authAxios } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchOverdueInvoices = async () => {
      try {
        const response = await authAxios.get('/api/billing/overdue');
        setReminders(response.data);
      } catch (err) {
        setError('Failed to load overdue invoices');
        console.error('Reminder error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueInvoices();
  }, []);

  const handleSendReminder = async (invoiceId) => {
    try {
      setSending(true);
      const encryptedData = HIPAAEncryptionService.encryptSensitiveData({
        invoiceId,
        action: 'reminder_sent'
      });

      await authAxios.post(`/api/billing/reminders/${invoiceId}`);
      
      await AuditService.logTransaction({
        userId: authAxios.currentUser.id,
        action: 'payment_reminder_sent',
        entityId: invoiceId,
        entityType: 'billing',
        encryptedData
      });

      setReminders(prev => prev.filter(r => r.id !== invoiceId));
    } catch (err) {
      setError('Failed to send reminder');
      console.error('Reminder send error:', err);
    } finally {
      setSending(false);
    }
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
        <FiClock className="text-yellow-600" />
        <h3 className="text-lg font-semibold">Payment Reminders</h3>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reminders.map((reminder) => (
              <tr key={reminder.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{reminder.patientName}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(reminder.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  ${(reminder.amountDue / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <button
                    onClick={() => handleSendReminder(reminder.id)}
                    disabled={sending}
                    className="flex items-center text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                  >
                    <FiSend className="mr-1" />
                    {sending ? 'Sending...' : 'Send Reminder'}
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