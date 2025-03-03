import React from 'react';
import { FiCreditCard, FiPlus } from 'react-icons/fi';

const PaymentMethods = ({ paymentMethods, onAdd, onEdit, onDelete, onSetDefault, isPatient, isAdmin }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Payment Methods</h2>
        {(isPatient || isAdmin) && (
          <button
            onClick={onAdd}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Add Payment Method"
            role="button"
          >
            <FiPlus className="mr-1.5 h-4 w-4" />
            Add Payment Method
          </button>
        )}
      </div>
      {paymentMethods.length === 0 ? (
        <div className="text-center py-6">
          <FiCreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isPatient ? 'Add a payment method to easily pay your invoices.' : 'This patient has no payment methods on file.'}
          </p>
          {isPatient && (
            <div className="mt-6">
              <button
                onClick={onAdd}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="mr-1.5 h-4 w-4" />
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map(method => (
            <div key={method._id} className="border border-gray-200 rounded-lg p-4 relative">
              {method.isDefault && (
                <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Default
                </span>
              )}
              <div className="flex items-center mb-2">
                <FiCreditCard className="mr-2 text-gray-500" />
                <span className="font-medium text-gray-900">{method.cardType} •••• {method.lastFour}</span>
              </div>
              <p className="text-sm text-gray-500">Expires: {method.expiryMonth}/{method.expiryYear}</p>
              <p className="text-sm text-gray-500">{method.billingName}</p>
              {(isPatient || isAdmin) && (
                <div className="mt-4 flex justify-end space-x-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => onSetDefault(method._id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                      aria-label="Set as Default"
                      role="button"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(method)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                    aria-label="Edit Payment Method"
                    role="button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(method._id)}
                    className="text-xs text-red-600 hover:text-red-800"
                    aria-label="Delete Payment Method"
                    role="button"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethods; 