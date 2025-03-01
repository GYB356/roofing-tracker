import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiFileText, 
  FiPlus, 
  FiFilter, 
  FiSearch, 
  FiRefreshCw, 
  FiAlertTriangle, 
  FiCheck, 
  FiX,
  FiCalendar,
  FiClock,
  FiUser,
  FiEdit,
  FiTrash2,
  FiDownload
} from 'react-icons/fi';
import { formatDate } from '../../utils/dateUtils';
import PrescriptionForm from './PrescriptionForm';
import PrescriptionDetails from './PrescriptionDetails';

const Prescriptions = () => {
  const { currentUser } = useAuth();
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch prescriptions on component mount
  useEffect(() => {
    fetchPrescriptions();
  }, []);
  
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prescriptions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }
      
      const data = await response.json();
      setPrescriptions(data);
      setError('');
    } catch (err) {
      setError('Error loading prescriptions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePrescription = () => {
    setSelectedPrescription(null);
    setShowForm(true);
  };
  
  const handleEditPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowForm(true);
  };
  
  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetails(true);
  };
  
  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete prescription');
      }
      
      // Update state after successful deletion
      setPrescriptions(prev => prev.filter(p => p._id !== prescriptionId));
      
      if (selectedPrescription && selectedPrescription._id === prescriptionId) {
        setSelectedPrescription(null);
        setShowDetails(false);
      }
    } catch (err) {
      setError('Error deleting prescription. Please try again.');
      console.error(err);
    }
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setSelectedPrescription(null);
  };
  
  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedPrescription(null);
  };
  
  const handleRefillRequest = async (prescriptionId) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/refill`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to request refill');
      }
      
      // Update the prescription in state
      const updatedData = await response.json();
      setPrescriptions(prev => 
        prev.map(p => p._id === prescriptionId ? updatedData : p)
      );
      
      if (selectedPrescription && selectedPrescription._id === prescriptionId) {
        setSelectedPrescription(updatedData);
      }
      
      alert('Refill request submitted successfully');
    } catch (err) {
      setError('Error requesting refill. Please try again.');
      console.error(err);
    }
  };
  
  const filterPrescriptions = () => {
    let filtered = [...prescriptions];
    
    // Apply filter
    const now = new Date();
    switch (filter) {
      case 'active':
        filtered = filtered.filter(p => {
          const expiryDate = new Date(p.expiryDate);
          return expiryDate > now && !p.discontinued;
        });
        break;
      case 'expired':
        filtered = filtered.filter(p => {
          const expiryDate = new Date(p.expiryDate);
          return expiryDate <= now && !p.discontinued;
        });
        break;
      case 'discontinued':
        filtered = filtered.filter(p => p.discontinued);
        break;
      case 'refill-requested':
        filtered = filtered.filter(p => p.refillRequested && !p.refillApproved);
        break;
      default:
        break;
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.medication && p.medication.toLowerCase().includes(term)) ||
        (p.dosage && p.dosage.toLowerCase().includes(term)) ||
        (p.instructions && p.instructions.toLowerCase().includes(term)) ||
        (p.prescribedBy && p.prescribedBy.name && p.prescribedBy.name.toLowerCase().includes(term)) ||
        (p.patient && p.patient.name && p.patient.name.toLowerCase().includes(term))
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.prescribedDate) - new Date(a.prescribedDate));
    
    return filtered;
  };
  
  const filteredPrescriptions = filterPrescriptions();
  
  const getStatusBadge = (prescription) => {
    const now = new Date();
    const expiryDate = new Date(prescription.expiryDate);
    
    if (prescription.discontinued) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Discontinued
        </span>
      );
    } else if (prescription.refillApproved) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Refill Approved
        </span>
      );
    } else if (prescription.refillRequested) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Refill Requested
        </span>
      );
    } else if (expiryDate <= now) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          Expired
        </span>
      );
    } else {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Active
        </span>
      );
    }
  };
  
  const canRequestRefill = (prescription) => {
    if (!prescription) return false;
    
    const now = new Date();
    const expiryDate = new Date(prescription.expiryDate);
    
    return (
      !prescription.discontinued &&
      expiryDate > now &&
      !prescription.refillRequested &&
      !prescription.refillApproved &&
      prescription.refillsRemaining > 0 &&
      currentUser.role === 'patient'
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          <FiFileText className="inline-block mr-2" />
          Prescriptions
        </h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:w-64 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:w-auto dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Prescriptions</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="discontinued">Discontinued</option>
              <option value="refill-requested">Refill Requested</option>
            </select>
          </div>
          
          {currentUser.role === 'doctor' && (
            <button
              onClick={handleCreatePrescription}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiPlus className="mr-2" />
              New Prescription
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 mb-6">
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
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <FiFileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No prescriptions found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filter === 'active' 
              ? "You don't have any active prescriptions." 
              : filter === 'expired' 
                ? "You don't have any expired prescriptions." 
                : "No prescriptions match your search criteria."}
          </p>
          {currentUser.role === 'doctor' && (
            <div className="mt-6">
              <button
                onClick={handleCreatePrescription}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiPlus className="mr-2" />
                Create Prescription
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPrescriptions.map((prescription) => (
              <li key={prescription._id}>
                <div 
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleViewDetails(prescription)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiFileText className="h-6 w-6 text-primary-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {prescription.medication}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {prescription.dosage}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {getStatusBadge(prescription)}
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>
                          Expires: {formatDate(prescription.expiryDate, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {prescription.instructions}
                    </p>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiUser className="flex-shrink-0 mr-1.5 h-4 w-4" />
                      <p>
                        {currentUser.role === 'patient' 
                          ? `Dr. ${prescription.prescribedBy?.name || 'Unknown'}`
                          : `${prescription.patient?.name || 'Unknown'}`}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {canRequestRefill(prescription) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefillRequest(prescription._id);
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <FiRefreshCw className="mr-1" />
                          Request Refill
                        </button>
                      )}
                      
                      {currentUser.role === 'doctor' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPrescription(prescription);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <FiEdit className="mr-1" />
                            Edit
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePrescription(prescription._id);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <FiTrash2 className="mr-1" />
                            Delete
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // In a real app, this would download a PDF of the prescription
                          alert('Downloading prescription...');
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <FiDownload className="mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {showForm && (
        <PrescriptionForm
          prescription={selectedPrescription}
          onClose={handleFormClose}
          onSave={(newPrescription) => {
            if (selectedPrescription) {
              // Update existing prescription
              setPrescriptions(prev => 
                prev.map(p => p._id === newPrescription._id ? newPrescription : p)
              );
            } else {
              // Add new prescription
              setPrescriptions(prev => [...prev, newPrescription]);
            }
            handleFormClose();
          }}
        />
      )}
      
      {showDetails && selectedPrescription && (
        <PrescriptionDetails
          prescription={selectedPrescription}
          onClose={handleDetailsClose}
          onEdit={() => {
            handleDetailsClose();
            handleEditPrescription(selectedPrescription);
          }}
          onDelete={() => {
            handleDetailsClose();
            handleDeletePrescription(selectedPrescription._id);
          }}
          onRefillRequest={() => {
            handleRefillRequest(selectedPrescription._id);
          }}
          canRequestRefill={canRequestRefill(selectedPrescription)}
        />
      )}
    </div>
  );
};

export default Prescriptions; 