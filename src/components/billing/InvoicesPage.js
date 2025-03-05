import React from 'react';
import { FiFileText, FiDownload, FiFilter } from 'react-icons/fi';

// Inline PageLayout component
const PageLayout = ({ 
  title, 
  description, 
  bgColor = "bg-blue-600", 
  textColor = "text-blue-100", 
  children,
  actions
}) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-screen-xl">
      <div className={`${bgColor} rounded-t-lg shadow-lg overflow-hidden`}>
        <div className="px-6 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className={`mt-2 ${textColor}`}>{description}</p>
            </div>
            {actions && (
              <div className="ml-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

const InvoicesPage = () => {
  const actionButtons = (
    <div className="flex space-x-2">
      <button className="bg-white text-yellow-600 hover:bg-yellow-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiFilter className="mr-2" />
        Filter
      </button>
      <button className="bg-yellow-700 text-white hover:bg-yellow-800 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiDownload className="mr-2" />
        Export
      </button>
    </div>
  );

  // Sample invoices data
  const invoices = [
    { id: 'INV-2023-001', date: '2023-12-15', amount: '$150.00', status: 'Paid' },
    { id: 'INV-2023-002', date: '2023-12-28', amount: '$75.50', status: 'Pending' },
    { id: 'INV-2024-001', date: '2024-01-10', amount: '$200.00', status: 'Paid' },
  ];

  return (
    <PageLayout
      title="Invoices"
      description="View and manage your billing invoices."
      bgColor="bg-yellow-600"
      textColor="text-yellow-100"
      actions={actionButtons}
    >
      {invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Invoice #</th>
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Date</th>
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Amount</th>
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Status</th>
                <th className="py-3 px-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                    <div className="flex items-center">
                      <FiFileText className="text-yellow-500 mr-2" />
                      {invoice.id}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{invoice.date}</td>
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{invoice.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                      View
                    </button>
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiFileText className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Invoices Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You don't have any invoices in your billing history yet.
          </p>
        </div>
      )}
      
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for more invoice management features.
        </p>
      </div>
    </PageLayout>
  );
};

export default InvoicesPage;