import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiFileText, 
  FiPlus, 
  FiFilter, 
  FiSearch, 
  FiAlertTriangle, 
  FiX,
  FiCalendar,
  FiUser,
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiShare2
} from 'react-icons/fi';
import { formatDate } from '../../utils/dateUtils';
import LabForm from './LabForm';
import LabDetails from './LabDetails';
import LoadingSpinner from '../common/LoadingSpinner';

const Labs = () => {
  const { currentUser } = useAuth();
  
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch lab results on component mount
  useEffect(() => {
    fetchLabResults();
  }, []);
  
  const fetchLabResults = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/labs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch lab results');
      }
      
      const data = await response.json();
      setLabResults(data);
      setError('');
    } catch (err) {
      setError('Error loading lab results. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateLab = () => {
    setSelectedLab(null);
    setShowForm(true);
  };
  
  const handleEditLab = (lab) => {
    setSelectedLab(lab);
    setShowForm(true);
  };
  
  const handleViewDetails = (lab) => {
    setSelectedLab(lab);
    setShowDetails(true);
  };
  
  const handleDeleteLab = async (labId) => {
    if (!window.confirm('Are you sure you want to delete this lab result?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/labs/${labId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete lab result');
      }
      
      // Update state after successful deletion
      setLabResults(prev => prev.filter(lab => lab._id !== labId));
      
      if (selectedLab && selectedLab._id === labId) {
        setSelectedLab(null);
        setShowDetails(false);
      }
    } catch (err) {
      setError('Error deleting lab result. Please try again.');
      console.error(err);
    }
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setSelectedLab(null);
  };
  
  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedLab(null);
  };
  
  const handleShareLab = (labId) => {
    // In a real app, this would open a sharing dialog
    alert(`Sharing lab result ${labId}`);
  };
  
  const filterLabResults = () => {
    let filtered = [...labResults];
    
    // Apply filter
    switch (filter) {
      case 'abnormal':
        filtered = filtered.filter(lab => lab.hasAbnormalResults);
        break;
      case 'pending':
        filtered = filtered.filter(lab => !lab.resultsAvailable);
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(lab => new Date(lab.testDate) >= thirtyDaysAgo);
        break;
      default:
        break;
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lab => 
        (lab.testName && lab.testName.toLowerCase().includes(term)) ||
        (lab.testType && lab.testType.toLowerCase().includes(term)) ||
        (lab.orderedBy && lab.orderedBy.name && lab.orderedBy.name.toLowerCase().includes(term)) ||
        (lab.patient && lab.patient.name && lab.patient.name.toLowerCase().includes(term)) ||
        (lab.notes && lab.notes.toLowerCase().includes(term))
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
    
    return filtered;
  };
  
  const filteredLabResults = filterLabResults();
  
  const getStatusBadge = (lab) => {
    if (!lab.resultsAvailable) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Pending
        </span>
      );
    } else if (lab.hasAbnormalResults) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Abnormal
        </span>
      );
    } else {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Normal
        </span>
      );
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          <FiFileText className="inline-block mr-2" />
          Laboratory Results
        </h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search lab results..."
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
              <option value="all">All Results</option>
              <option value="abnormal">Abnormal Results</option>
              <option value="pending">Pending Results</option>
              <option value="recent">Last 30 Days</option>
            </select>
          </div>
          
          {currentUser.role === 'doctor' && (
            <button
              onClick={handleCreateLab}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiPlus className="mr-2" />
              Order New Lab
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
          <LoadingSpinner size="large" color="primary" />
        </div>
      ) : filteredLabResults.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <FiFileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No lab results found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filter === 'abnormal' 
              ? "No abnormal lab results found." 
              : filter === 'pending' 
                ? "No pending lab results found." 
                : "No lab results match your search criteria."}
          </p>
          {currentUser.role === 'doctor' && (
            <div className="mt-6">
              <button
                onClick={handleCreateLab}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiPlus className="mr-2" />
                Order New Lab
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLabResults.map((lab) => (
              <li key={lab._id}>
                <div 
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleViewDetails(lab)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiFileText className="h-6 w-6 text-primary-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {lab.testName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {lab.testType}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {getStatusBadge(lab)}
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>
                          {formatDate(lab.testDate, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FiUser className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    <p>
                      {currentUser.role === 'patient' 
                        ? `Ordered by: Dr. ${lab.orderedBy?.name || 'Unknown'}`
                        : `Patient: ${lab.patient?.name || 'Unknown'}`}
                    </p>
                  </div>
                  
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // In a real app, this would download a PDF of the lab result
                        alert('Downloading lab result...');
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <FiDownload className="mr-1" />
                      Download
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareLab(lab._id);
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <FiShare2 className="mr-1" />
                      Share
                    </button>
                    
                    {currentUser.role === 'doctor' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLab(lab);
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <FiEdit className="mr-1" />
                          Edit
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLab(lab._id);
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {showForm && (
        <LabForm
          lab={selectedLab}
          onClose={handleFormClose}
          onSave={(newLab) => {
            if (selectedLab) {
              // Update existing lab
              setLabResults(prev => 
                prev.map(lab => lab._id === newLab._id ? newLab : lab)
              );
            } else {
              // Add new lab
              setLabResults(prev => [...prev, newLab]);
            }
            handleFormClose();
          }}
        />
      )}
      
      {showDetails && selectedLab && (
        <LabDetails
          lab={selectedLab}
          onClose={handleDetailsClose}
          onEdit={() => {
            handleDetailsClose();
            handleEditLab(selectedLab);
          }}
          onDelete={() => {
            handleDetailsClose();
            handleDeleteLab(selectedLab._id);
          }}
          onShare={() => handleShareLab(selectedLab._id)}
        />
      )}
    </div>
  );
};

export default Labs; 