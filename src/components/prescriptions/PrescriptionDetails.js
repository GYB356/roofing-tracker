import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const PrescriptionDetails = () => {
  const { id } = useParams();
  const { currentUser, authAxios } = useAuth();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!prescription) {
    return <div>Prescription not found</div>;
  }

  return (
    <div>
      <h2>{prescription.medication}</h2>
      <p>Dosage: {prescription.dosage}</p>
      <p>Instructions: {prescription.instructions}</p>
    </div>
  );
};

export default PrescriptionDetails;
