import React from 'react';
import LoadingSpinner from '../LoadingSpinner';

const InsuranceForm = ({ editingInsurance, onSubmit, onCancel, loading }) => {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const insuranceData = {
        provider: formData.get('provider'),
        policyNumber: formData.get('policyNumber'),
        coverageType: formData.get('coverageType'),
        expiryDate: formData.get('expiryDate')
      };
      onSubmit(insuranceData);
    }}>
      <div className="px-6 py-4 space-y-4">
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
            Provider
          </label>
          <input
            type="text"
            id="provider"
            name="provider"
            defaultValue={editingInsurance?.provider || ''}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700">
            Policy Number
          </label>
          <input
            type="text"
            id="policyNumber"
            name="policyNumber"
            defaultValue={editingInsurance?.policyNumber || ''}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label htmlFor="coverageType" className="block text-sm font-medium text-gray-700">
            Coverage Type
          </label>
          <input
            type="text"
            id="coverageType"
            name="coverageType"
            defaultValue={editingInsurance?.coverageType || ''}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
            Expiry Date
          </label>
          <input
            type="date"
            id="expiryDate"
            name="expiryDate"
            defaultValue={editingInsurance?.expiryDate || ''}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
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

export default InsuranceForm; 