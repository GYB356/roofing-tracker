import React, { useState, useEffect } from 'react';
import { FiClock, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const BAAVersionHistory = ({ baaId, onCompareClick }) => {
  const { currentUser } = useAuth();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [compareEnabled, setCompareEnabled] = useState(false);

  useEffect(() => {
    fetchVersionHistory();
  }, [baaId]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hipaa/baa/${baaId}/versions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch BAA version history');
      }

      const data = await response.json();
      setVersions(data);
    } catch (err) {
      console.error('Error fetching BAA version history:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangeDescription = (changes) => {
    const descriptions = [];
    if (changes.terms) descriptions.push('Terms updated');
    if (changes.status) descriptions.push(`Status changed to ${changes.status}`);
    if (changes.expirationDate) descriptions.push('Expiration date modified');
    return descriptions.join(', ');
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
                You do not have permission to view BAA version history.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleVersionSelect = (version) => {
    // Toggle selection
    if (selectedVersions.some(v => v.id === version.id)) {
      setSelectedVersions(selectedVersions.filter(v => v.id !== version.id));
    } else {
      // Limit to 2 selections
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, version]);
      } else {
        // Replace the oldest selection
        setSelectedVersions([selectedVersions[1], version]);
      }
    }
  };

  // Enable compare button when exactly 2 versions are selected
  useEffect(() => {
    setCompareEnabled(selectedVersions.length === 2);
  }, [selectedVersions]);

  const handleCompareClick = () => {
    if (compareEnabled && onCompareClick) {
      onCompareClick(selectedVersions);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <FiClock className="mr-2" />
          Version History
        </h3>
        <button
          onClick={handleCompareClick}
          disabled={!compareEnabled}
          className={`px-3 py-1 rounded text-sm ${compareEnabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Compare Selected ({selectedVersions.length}/2)
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400">
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
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {versions.map((version) => (
              <li key={version.id} className={`hover:bg-gray-50 ${selectedVersions.some(v => v.id === version.id) ? 'bg-blue-50' : ''}`}>
                <div className="absolute left-4 top-4">
                  <input
                    type="checkbox"
                    checked={selectedVersions.some(v => v.id === version.id)}
                    onChange={() => handleVersionSelect(version)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="px-4 py-4 sm:px-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600">
                          Version {version.versionNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(version.timestamp)}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Modified by: {version.modifiedBy}</p>
                        <p>{getChangeDescription(version.changes)}</p>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedVersion === version.id ? (
                        <FiChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <FiChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                  {expandedVersion === version.id && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <div className="space-y-2">
                        {Object.entries(version.changes).map(([field, value]) => (
                          <div key={field} className="grid grid-cols-3 gap-4">
                            <div className="text-sm font-medium text-gray-500">
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                            </div>
                            <div className="col-span-2 text-sm text-gray-900">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BAAVersionHistory;