import React from 'react';
import { FiCreditCard, FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';

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

const PaymentMethodsPage = () => {
  const actionButtons = (
    <button className="bg-white text-yellow-600 hover:bg-yellow-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
      <FiPlus className="mr-2" />
      Add Payment Method
    </button>
  );

  // Sample payment methods
  const paymentMethods = [
    { id: 1, type: 'Credit Card', last4: '4242', expiryDate: '09/25', isDefault: true },
    { id: 2, type: 'Bank Account', last4: '7890', name: 'Chase Checking', isDefault: false }
  ];

  return (
    <PageLayout
      title="Payment Methods"
      description="Manage your payment options for billing."
      bgColor="bg-yellow-600"
      textColor="text-yellow-100"
      actions={actionButtons}
    >
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Payment Methods</h2>
        
        <div className="space-y-4">
          {paymentMethods.map(method => (
            <div key={method.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg mr-4">
                  <FiCreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {method.type} ending in {method.last4}
                    </h3>
                    {method.isDefault && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {method.type === 'Credit Card' ? `Expires ${method.expiryDate}` : method.name}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <FiEdit />
                </button>
                <button className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {paymentMethods.length === 0 && (
          <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <FiCreditCard className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Payment Methods</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't added any payment methods yet.
            </p>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg">
              Add Payment Method
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">About Payment Methods</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Your payment information is encrypted and securely stored. We use industry-standard security measures to protect your sensitive data.
          Your default payment method will be used for all automatic charges unless you specify otherwise.
        </p>
      </div>
      
      <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for more payment method management features.
        </p>
      </div>
    </PageLayout>
  );
};

export default PaymentMethodsPage;