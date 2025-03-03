import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Billing = () => {
  const { user, hasRole } = useAuth();
  const { socket } = useSocket();
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasRole(['patient', 'admin', 'staff'])) {
      setError('Access Denied');
      return;
    }

    // Fetch billing invoices
    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/billing/invoices');
        const data = await response.json();
        setInvoices(data);
      } catch (err) {
        setError('Failed to load invoices');
      }
    };

    fetchInvoices();
  }, [hasRole]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!invoices.length) {
    return <div>Loading...</div>;
  }

  return (
    <div className="billing-page p-4">
      <h1 className="text-2xl font-bold">Billing</h1>
      <ul>
        {invoices.map(invoice => (
          <li key={invoice.id} className="mb-2">
            {invoice.patientName} - {invoice.description} (${invoice.amount})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Billing; 