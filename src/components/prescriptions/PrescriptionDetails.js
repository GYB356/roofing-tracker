import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiDownload, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const PrescriptionDetails = () => {
  const { id } = useParams();
  const { currentUser, authAxios } = useAuth();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refillRequestStatus, setRefillRequestStatus] = useState('');

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const response = await authAxios.get(`/api/prescriptions/${id}`);
        setPrescription(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching prescription:', err);
        setError('Failed to load prescription details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchPrescription();
    }
  }, [id, currentUser, authAxios]);

  const handleRefillRequest = async () => {
    try {
      setRefillRequestStatus('processing');
      const response = await authAxios.post(`/api/prescriptions/${id}/refill`);
      setPrescription(response.data);
      setRefillRequestStatus('success');
    } catch (err) {
      console.error('Error requesting refill:', err);
      setRefillRequestStatus('error');
      setError('Failed to request refill. Please try again later.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  if (!prescription) {
    return <div className="p-4">Prescription not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/prescriptions" className="flex items-center text-blue-600 hover:text-blue-800">
          <FiArrowLeft className="mr-2" /> Back to Prescriptions
        </Link>
        <div className="text-sm text-gray-500">
          <FiCalendar className="inline mr-1" />
          Prescribed: {new Date(prescription.startDate).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">{prescription.drugName}</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Dosage Information</h3>
            <p className="text-gray-700">Dosage: {prescription.dosage}</p>
            <p className="text-gray-700">Frequency: {prescription.frequency}</p>
            <p className="text-gray-700">Duration: {prescription.duration}</p>
          </div>

          {prescription.interactions.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <FiAlertTriangle className="text-yellow-500 mr-2" />
                Drug Interactions
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {prescription.interactions.map((interaction, index) => (
                  <li key={index} className="text-gray-700">{interaction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Prescription Status</h3>
            <p className="text-gray-700">Status: {prescription.status}</p>
            <p className="text-gray-700">Refills Remaining: {prescription.refillsRemaining}</p>
            <p className="text-gray-700">Refills Allowed: {prescription.refillsAllowed}</p>
            {prescription.lastFilledDate && (
              <p className="text-gray-700">
                Last Filled: {new Date(prescription.lastFilledDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions</h3>
            <p className="text-gray-700">{prescription.instructions}</p>
          </div>

          {prescription.sideEffects.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Potential Side Effects</h3>
              <ul className="list-disc list-inside space-y-1">
                {prescription.sideEffects.map((effect, index) => (
                  <li key={index} className="text-gray-700">{effect}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {prescription.status === 'ACTIVE' && prescription.refillsRemaining > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleRefillRequest}
            disabled={refillRequestStatus === 'processing'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            <FiRefreshCw className={`mr-2 ${refillRequestStatus === 'processing' ? 'animate-spin' : ''}`} />
            Request Refill
          </button>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDetails;
