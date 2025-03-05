import React from 'react';
import { FiDollarSign, FiCreditCard, FiFileText } from 'react-icons/fi';

// Inline PageLayout component to avoid import issues
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
      {/* Header section */}
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
      
      {/* Content section */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

const BillingPage = () => {
  const actionButtons = (
    <button className="bg-white text-yellow-600 hover:bg-yellow-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
      <FiCreditCard className="mr-2" />
      Payment Methods
    </button>
  );

  return (
    <PageLayout
      title="Billing"
      description="View and manage payments and insurance claims."
      bgColor="bg-yellow-600"
      textColor="text-yellow-100"
      actions={actionButtons}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiDollarSign className="h-8 w-8 text-yellow-500 mr-3" />
            <h3 className="text-lg font-semibold">Current Balance</h3>
          </div>
          <p className="text-3xl font-bold">$0.00</p>
          <p className="text-sm text-gray-500 mt-1">No outstanding payments</p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiFileText className="h-8 w-8 text-yellow-500 mr-3" />
            <h3 className="text-lg font-semibold">Recent Invoices</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">No recent invoices found.</p>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for billing features.
        </p>
      </div>
    </PageLayout>
  );
};

export default BillingPage;