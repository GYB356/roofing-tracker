import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiAlertTriangle, FiRefreshCw, FiCalendar, FiSearch, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const PrescriptionList = () => {
  const { authAxios, currentUser } = useAuth();
  const { socket } = useSocket();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchPrescriptions();

    if (socket) {
      socket.on('prescription:updated', handlePrescriptionUpdate);
      socket.on('prescription:created', handlePrescriptionCreate);
      socket.on('prescription:deleted', handlePrescriptionDelete);

      return () => {
        socket.off('prescription:updated');
        socket.off('prescription:created');
        socket.off('prescription:deleted');
      };
    }
  }, [socket]);

  const handlePrescriptionUpdate = useCallback((updatedPrescription) => {
    setPrescriptions(prev => 
      prev.map(p => p.id === updatedPrescription.id ? updatedPrescription : p)
    );
  }, []);

  const handlePrescriptionCreate = useCallback((newPrescription) => {
    setPrescriptions(prev => [...prev, newPrescription]);
  }, []);

  const handlePrescriptionDelete = useCallback((prescriptionId) => {
    setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get('/api/prescriptions');
      setPrescriptions(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = useMemo(() => prescriptions
    .filter(prescription => {
      const matchesFilter = 
        filter === 'all' ||
        (filter === 'active' && prescription.status === 'ACTIVE') ||
        (filter === 'completed' && prescription.status === 'COMPLETED') ||
        (filter === 'cancelled' && prescription.status === 'CANCELLED');

      const matchesSearch = searchTerm === '' ||
        prescription.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.dosage.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.startDate) - new Date(a.startDate);
      if (sortBy === 'name') return a.drugName.localeCompare(b.drugName);
      return 0;
    });
  }, [prescriptions, filter, searchTerm, sortBy]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="relative w-full sm:w-64 mb-2 sm:mb-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchPrescriptions().finally(() => setIsRefreshing(false));
            }}
            disabled={isRefreshing}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
            aria-label="Refresh prescriptions"
          >
            <FiRefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Prescriptions</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPrescriptions.map(prescription => (
          <Link
            key={prescription.id}
            to={`/prescriptions/${prescription.id}`}
            className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{prescription.drugName}</h3>
                <p className="text-sm text-gray-600">{prescription.dosage}</p>
              </div>
              <div className="flex items-center space-x-2">
                {prescription.status === 'ACTIVE' && (
                  <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                    Active
                  </span>
                )}
                {prescription.interactions.length > 0 && (
                  <FiAlertTriangle className="text-yellow-500" />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <FiCalendar className="mr-1" />
              {new Date(prescription.startDate).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>

      {filteredPrescriptions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No prescriptions found
        </div>
      )}
    </div>
  );
};

export default PrescriptionList;
