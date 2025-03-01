import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiX, 
  FiAlertTriangle, 
  FiCheck, 
  FiCalendar, 
  FiUser, 
  FiFileText,
  FiInfo
} from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';

const LabForm = ({ lab, onClose, onSave }) => {
  const { currentUser } = useAuth();
  const isEditing = !!lab;
  
  const [formData, setFormData] = useState({
    testName: '',
    testType: '',
    patientId: '',
    testDate: new Date().toISOString().split('T')[0],
    notes: '',
    resultsAvailable: false,
    hasAbnormalResults: false,
    results: [],
    urgency: 'routine'
  });
  
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [testTypes, setTestTypes] = useState([
    'Complete Blood Count (CBC)',
    'Basic Metabolic Panel (BMP)',
    'Comprehensive Metabolic Panel (CMP)',
    'Lipid Panel',
    'Liver Function Tests',
    'Thyroid Function Tests',
    'Hemoglobin A1C',
    'Urinalysis',
    'Vitamin D',
    'COVID-19 Test',
    'Strep Test',
    'Flu Test',
    'Pregnancy Test',
    'STI Panel',
    'Other'
  ]);
  
  // Populate form with existing lab data if editing
  useEffect(() => {
    if (isEditing && lab) {
      setFormData({
        testName: lab.testName || '',
        testType: lab.testType || '',
        patientId: lab.patient?._id || '',
        testDate: lab.testDate ? new Date(lab.testDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: lab.notes || '',
        resultsAvailable: lab.resultsAvailable || false,
        hasAbnormalResults: lab.hasAbnormalResults || false,
        results: lab.results || [],
        urgency: lab.urgency || 'routine'
      });
    }
    
    // If user is a doctor or admin, fetch patients
    if (currentUser.role === 'doctor' || currentUser.role === 'admin') {
      fetchPatients();
    } else if (currentUser.role === 'patient') {
      // If user is a patient, set their ID as the patient ID
      setFormData(prev => ({
        ...prev,
        patientId: currentUser._id
      }));
    }
  }, [lab, isEditing, currentUser]);
  
  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await fetch('/api/patients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const data = await response.json();
      setPatients(data);
    } catch (err) {
      setError('Error loading patients. Please try again.');
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleResultChange = (index, field, value) => {
    const updatedResults = [...formData.results];
    
    if (!updatedResults[index]) {
      updatedResults[index] = { name: '', value: '', normalRange: '', isAbnormal: false };
    }
    
    updatedResults[index][field] = field === 'isAbnormal' ? value : value;
    
    setFormData(prev => ({
      ...prev,
      results: updatedResults
    }));
  };
  
  const addResultField = () => {
    setFormData(prev => ({
      ...prev,
      results: [...prev.results, { name: '', value: '', normalRange: '', isAbnormal: false }]
    }));
  };
  
  const removeResultField = (index) => {
    const updatedResults = [...formData.results];
    updatedResults.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      results: updatedResults
    }));
  };
  
  const validateForm = () => {
    if (!formData.testName.trim()) {
      setError('Test name is required');
      return false;
    }
    
    if (!formData.testType.trim()) {
      setError('Test type is required');
      return false;
    }
    
    if (!formData.patientId) {
      setError('Patient is required');
      return false;
    }
    
    if (!formData.testDate) {
      setError('Test date is required');
      return false;
    }
    
    // If results are available, validate that at least one result is entered
    if (formData.resultsAvailable && formData.results.length === 0) {
      setError('At least one result is required when results are available');
      return false;
    }
    
    // Validate each result if results are available
    if (formData.resultsAvailable) {
      for (let i = 0; i < formData.results.length; i++) {
        const result = formData.results[i];
        if (!result.name.trim() || !result.value.trim()) {
          setError(`Result #${i + 1} is incomplete. Name and value are required.`);
          return false;
        }
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Check if any results are abnormal
      const hasAbnormalResults = formData.results.some(result => result.isAbnormal);
      
      const labData = {
        ...formData,
        hasAbnormalResults
      };
      
      const url = isEditing 
        ? `/api/labs/${lab._id}` 
        : '/api/labs';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(labData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} lab order`);
      }
      
      const savedLab = await response.json();
      onSave(savedLab);
    } catch (err) {
      setError(`Error ${isEditing ? 'updating' : 'creating'} lab order. Please try again.`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FiFileText className="mr-2" />
            {isEditing ? 'Edit Lab Order' : 'Order New Lab Test'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <label htmlFor="testName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Test Name*
              </label>
              <input
                type="text"
                id="testName"
                name="testName"
                value={formData.testName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div className="col-span-1">
              <label htmlFor="testType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Test Type*
              </label>
              <select
                id="testType"
                name="testType"
                value={formData.testType}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Test Type</option>
                {testTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {(currentUser.role === 'doctor' || currentUser.role === 'admin') && (
              <div className="col-span-1">
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Patient*
                </label>
                {loadingPatients ? (
                  <div className="mt-1 flex items-center">
                    <LoadingSpinner size="small" color="primary" />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading patients...</span>
                  </div>
                ) : (
                  <select
                    id="patientId"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name || `${patient.firstName} ${patient.lastName}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            <div className="col-span-1">
              <label htmlFor="testDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Test Date*
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="testDate"
                  name="testDate"
                  value={formData.testDate}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <div className="col-span-1">
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Urgency
              </label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT (Immediate)</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Additional instructions or information..."
              />
            </div>
            
            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  id="resultsAvailable"
                  name="resultsAvailable"
                  type="checkbox"
                  checked={formData.resultsAvailable}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="resultsAvailable" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Results Available
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Check this box if you are entering results for this lab test.
              </p>
            </div>
            
            {formData.resultsAvailable && (
              <div className="col-span-2">
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Test Results</h3>
                    <button
                      type="button"
                      onClick={addResultField}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Add Result
                    </button>
                  </div>
                  
                  {formData.results.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No results added yet. Click "Add Result" to add test results.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.results.map((result, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Result #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeResultField(index)}
                              className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor={`result-name-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Test Name*
                              </label>
                              <input
                                type="text"
                                id={`result-name-${index}`}
                                value={result.name}
                                onChange={(e) => handleResultChange(index, 'name', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                                required={formData.resultsAvailable}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor={`result-value-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Value*
                              </label>
                              <input
                                type="text"
                                id={`result-value-${index}`}
                                value={result.value}
                                onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                                required={formData.resultsAvailable}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor={`result-range-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Normal Range
                              </label>
                              <input
                                type="text"
                                id={`result-range-${index}`}
                                value={result.normalRange}
                                onChange={(e) => handleResultChange(index, 'normalRange', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            
                            <div className="flex items-center">
                              <input
                                id={`result-abnormal-${index}`}
                                type="checkbox"
                                checked={result.isAbnormal}
                                onChange={(e) => handleResultChange(index, 'isAbnormal', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                              />
                              <label htmlFor={`result-abnormal-${index}`} className="ml-2 block text-xs text-gray-700 dark:text-gray-300">
                                Abnormal Result
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="small" color="white" className="mr-2" />
                  {isEditing ? 'Updating...' : 'Ordering...'}
                </>
              ) : (
                <>
                  <FiCheck className="mr-2" />
                  {isEditing ? 'Update Lab Order' : 'Order Lab Test'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabForm; 