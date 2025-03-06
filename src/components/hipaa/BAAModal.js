import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import { BAA_STATUS } from '../../utils/baaManagement';

const BAAModal = ({ isOpen, onClose, onSave, baa = null }) => {
  const [formData, setFormData] = useState({
    businessAssociateId: '',
    businessAssociateName: '',
    terms: '',
    status: BAA_STATUS.PENDING
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (baa) {
      setFormData({
        businessAssociateId: baa.businessAssociateId || '',
        businessAssociateName: baa.businessAssociateName || '',
        terms: baa.terms || '',
        status: baa.status || BAA_STATUS.PENDING
      });
    }
  }, [baa]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessAssociateId.trim()) {
      newErrors.businessAssociateId = 'Business Associate ID is required';
    }

    if (!formData.businessAssociateName.trim()) {
      newErrors.businessAssociateName = 'Business Associate Name is required';
    }

    if (!formData.terms.trim()) {
      newErrors.terms = 'Terms are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save BAA' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {baa ? 'Edit BAA' : 'Create New BAA'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {errors.submit && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="businessAssociateId" className="block text-sm font-medium text-gray-700">
              Business Associate ID
            </label>
            <input
              type="text"
              id="businessAssociateId"
              name="businessAssociateId"
              value={formData.businessAssociateId}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.businessAssociateId ? 'border-red-300' : ''}`}
            />
            {errors.businessAssociateId && (
              <p className="mt-1 text-sm text-red-600">{errors.businessAssociateId}</p>
            )}
          </div>

          <div>
            <label htmlFor="businessAssociateName" className="block text-sm font-medium text-gray-700">
              Business Associate Name
            </label>
            <input
              type="text"
              id="businessAssociateName"
              name="businessAssociateName"
              value={formData.businessAssociateName}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.businessAssociateName ? 'border-red-300' : ''}`}
            />
            {errors.businessAssociateName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessAssociateName}</p>
            )}
          </div>

          <div>
            <label htmlFor="terms" className="block text-sm font-medium text-gray-700">
              Terms
            </label>
            <textarea
              id="terms"
              name="terms"
              rows="4"
              value={formData.terms}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.terms ? 'border-red-300' : ''}`}
            />
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
            )}
          </div>

          {baa && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {Object.values(BAA_STATUS).map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Saving...' : baa ? 'Update BAA' : 'Create BAA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BAAModal;