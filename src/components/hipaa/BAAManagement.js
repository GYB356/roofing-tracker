// src/components/hipaa/BAAManagement.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiAlertCircle, FiClock } from 'react-icons/fi';
import BAAModal from './BAAModal';
import BAAVersionHistory from './BAAVersionHistory';
import BAACompare from './BAACompare';
import {
  createBAA,
  getBAA,
  updateBAAStatus,
  terminateBAA,
  BAA_STATUS
} from '../../utils/baaManagement';

const BAAManagement = () => {
  const { currentUser } = useAuth();
  const [baas, setBaas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCompareVersions, setShowCompareVersions] = useState(false);
  const [selectedBAA, setSelectedBAA] = useState(null);
  const [versionData, setVersionData] = useState([]);

  useEffect(() => {
    fetchBAAs();
  }, []);

  const fetchBAAs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hipaa/baa', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch BAAs');
      }

      const data = await response.json();
      setBaas(data);
    } catch (err) {
      console.error('Error fetching BAAs:', err);
      setError('Failed to load Business Associate Agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBAA = async (formData) => {
    try {
      const newBAA = await createBAA({
        id: formData.businessAssociateId,
        name: formData.businessAssociateName
      }, formData.terms, currentUser);

      setBaas([...baas, newBAA]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating BAA:', err);
      setError('Failed to create Business Associate Agreement');
    }
  };

  const handleUpdateStatus = async (baaId, newStatus) => {
    try {
      await updateBAAStatus(baaId, newStatus, currentUser);
      const updatedBAAs = baas.map(baa =>
        baa.id === baaId ? { ...baa, status: newStatus } : baa
      );
      setBaas(updatedBAAs);
    } catch (err) {
      console.error('Error updating BAA status:', err);
      setError('Failed to update BAA status');
    }
  };

  const handleTerminate = async (baaId, reason) => {
    try {
      await terminateBAA(baaId, reason, currentUser);
      const updatedBAAs = baas.map(baa =>
        baa.id === baaId ? { ...baa, status: BAA_STATUS.TERMINATED } : baa
      );
      setBaas(updatedBAAs);
    } catch (err) {
      console.error('Error terminating BAA:', err);
      setError('Failed to terminate BAA');
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You do not have permission to manage Business Associate Agreements.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Business Associate Agreements
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <FiPlus className="-ml-1 mr-2 h-5 w-5" />
          New BAA
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {baas.map((baa) => (
              <li key={baa.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {baa.businessAssociateName}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Status: <span className="font-medium">{baa.status}</span>
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setSelectedBAA(baa);
                          setShowVersionHistory(true);
                        }}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        title="View Version History"
                      >
                        <FiClock className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedBAA(baa)}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        <FiEdit className="h-5 w-5" />
                      </button>
                      {baa.status !== BAA_STATUS.TERMINATED && (
                        <button
                          onClick={() => handleTerminate(baa.id, 'User requested termination')}
                          className="inline-flex items-center text-sm text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Created: {new Date(baa.effectiveDate).toLocaleDateString()}</p>
                    <p>Expires: {new Date(baa.expirationDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCreateModal && (
        <BAAModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateBAA}
        />
      )}

      {selectedBAA && (
        <BAAModal
          isOpen={!!selectedBAA}
          onClose={() => setSelectedBAA(null)}
          onSave={(formData) => handleUpdateStatus(selectedBAA.id, formData.status)}
          baa={selectedBAA}
        />
      )}
      {showVersionHistory && selectedBAA && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                onClick={() => setShowVersionHistory(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BAAVersionHistory 
              baaId={selectedBAA.id} 
              onCompareClick={(versions) => {
                setVersionData(versions);
                setShowVersionHistory(false);
                setShowCompareVersions(true);
              }}
            />
          </div>
        </div>
      )}
      
      {showCompareVersions && selectedBAA && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
            <BAACompare 
              baaId={selectedBAA.id} 
              versions={versionData} 
              onClose={() => {
                setShowCompareVersions(false);
                setVersionData([]);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BAAManagement;