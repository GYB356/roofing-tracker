import React from 'react';
import { FiCreditCard } from 'react-icons/fi';

const InvoiceList = ({ invoices }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Invoices</h2>
      {invoices.length === 0 ? (
        <div className="text-center py-6">
          <FiCreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">No invoices available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map(invoice => (
            <div key={invoice._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FiCreditCard className="mr-2 text-gray-500" />
                <span className="font-medium text-gray-900">Invoice #{invoice.number}</span>
              </div>
              <p className="text-sm text-gray-500">Amount: ${invoice.amount}</p>
              <p className="text-sm text-gray-500">Due Date: {invoice.dueDate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList; 