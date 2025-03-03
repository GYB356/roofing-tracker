import React from 'react';
import { FiLock } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const PaymentMethodForm = ({ editingPaymentMethod, onSubmit, onCancel, loading }) => {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const paymentData = {
        cardType: formData.get('cardType'),
        cardNumber: formData.get('cardNumber'),
        lastFour: formData.get('cardNumber').slice(-4),
        expiryMonth: formData.get('expiryMonth'),
        expiryYear: formData.get('expiryYear'),
        cvv: formData.get('cvv'),
        billingName: formData.get('billingName'),
        billingAddress: {
          line1: formData.get('addressLine1'),
          line2: formData.get('addressLine2') || '',
          city: formData.get('city'),
          state: formData.get('state'),
          zipCode: formData.get('zipCode'),
          country: formData.get('country')
        },
        isDefault: formData.get('isDefault') === 'on'
      };
      onSubmit(paymentData);
    }}>
      <div className="px-6 py-4 space-y-4">
        <div>
          <label htmlFor="cardType" className="block text-sm font-medium text-gray-700">
            Card Type
          </label>
          <select
            id="cardType"
            name="cardType"
            defaultValue={editingPaymentMethod?.cardType || ''}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="" disabled>Select card type</option>
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="American Express">American Express</option>
            <option value="Discover">Discover</option>
          </select>
        </div>
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
            Card Number
          </label>
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            defaultValue={editingPaymentMethod ? `************${editingPaymentMethod.lastFour}` : ''}
            placeholder="•••• •••• •••• ••••"
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
            pattern="\d{13,19}"
            title="Card number should be between 13 and 19 digits"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700">
              Expiry Month
            </label>
            <select
              id="expiryMonth"
              name="expiryMonth"
              defaultValue={editingPaymentMethod?.expiryMonth || ''}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="" disabled>Month</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                return (
                  <option key={month} value={month}>
                    {month}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700">
              Expiry Year
            </label>
            <select
              id="expiryYear"
              name="expiryYear"
              defaultValue={editingPaymentMethod?.expiryYear || ''}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="" disabled>Year</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = (new Date().getFullYear() + i).toString();
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
            CVV
          </label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            defaultValue={editingPaymentMethod ? '***' : ''}
            placeholder="•••"
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
            pattern="\d{3,4}"
            title="CVV should be 3 or 4 digits"
          />
        </div>
        <div>
          <label htmlFor="billingName" className="block text-sm font-medium text-gray-700">
            Name on Card
          </label>
          <input
            type="text"
            id="billingName"
            name="billingName"
            defaultValue={editingPaymentMethod?.billingName || ''}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
            Billing Address
          </label>
          <input
            type="text"
            id="addressLine1"
            name="addressLine1"
            defaultValue={editingPaymentMethod?.billingAddress?.line1 || ''}
            placeholder="Street address"
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <input
            type="text"
            id="addressLine2"
            name="addressLine2"
            defaultValue={editingPaymentMethod?.billingAddress?.line2 || ''}
            placeholder="Apt, suite, etc. (optional)"
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              id="city"
              name="city"
              defaultValue={editingPaymentMethod?.billingAddress?.city || ''}
              placeholder="City"
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <input
              type="text"
              id="state"
              name="state"
              defaultValue={editingPaymentMethod?.billingAddress?.state || ''}
              placeholder="State/Province"
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              defaultValue={editingPaymentMethod?.billingAddress?.zipCode || ''}
              placeholder="ZIP / Postal code"
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <input
              type="text"
              id="country"
              name="country"
              defaultValue={editingPaymentMethod?.billingAddress?.country || ''}
              placeholder="Country"
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
        </div>
        <div className="flex items-center">
          <input
            id="isDefault"
            name="isDefault"
            type="checkbox"
            defaultChecked={editingPaymentMethod?.isDefault || false}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
            Set as default payment method
          </label>
        </div>
        <div className="text-xs text-gray-500">
          <FiLock className="inline-block mr-1" />
          Your payment information is encrypted and securely stored in compliance with HIPAA regulations.
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner size="small" className="mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentMethodForm; 