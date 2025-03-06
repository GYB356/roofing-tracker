// src/components/hipaa/BAACompare.js
import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getBAA } from '../../utils/baaManagement';
import { decryptData } from '../../utils/hipaaCompliance';

const BAACompare = ({ baaId, versions, onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leftVersion, setLeftVersion] = useState(null);
  const [rightVersion, setRightVersion] = useState(null);
  const [leftContent, setLeftContent] = useState(null);
  const [rightContent, setRightContent] = useState(null);
  const [differences, setDifferences] = useState([]);

  useEffect(() => {
    if (versions && versions.length >= 2) {
      // Default to comparing the latest two versions
      setLeftVersion(versions[1]);
      setRightVersion(versions[0]);
    }
  }, [versions]);

  useEffect(() => {
    if (leftVersion && rightVersion) {
      fetchVersionContents();
    }
  }, [leftVersion, rightVersion]);

  const fetchVersionContents = async () => {
    try {
      setLoading(true);
      
      // Fetch both versions in parallel
      const [leftResponse, rightResponse] = await Promise.all([
        fetch(`/api/hipaa/baa/${baaId}/version/${leftVersion.version}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch(`/api/hipaa/baa/${baaId}/version/${rightVersion.version}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (!leftResponse.ok || !rightResponse.ok) {
        throw new Error('Failed to fetch BAA versions for comparison');
      }

      const leftData = await leftResponse.json();
      const rightData = await rightResponse.json();

      // Decrypt terms if they are encrypted
      const leftTerms = typeof leftData.terms === 'string' ? 
        decryptData(leftData.terms) : leftData.terms;
      
      const rightTerms = typeof rightData.terms === 'string' ? 
        decryptData(rightData.terms) : rightData.terms;

      setLeftContent({
        ...leftData,
        terms: leftTerms
      });

      setRightContent({
        ...rightData,
        terms: rightTerms
      });

      // Calculate differences
      calculateDifferences(leftData, rightData, leftTerms, rightTerms);
    } catch (err) {
      console.error('Error fetching BAA versions:', err);
      setError('Failed to load BAA versions for comparison');
    } finally {
      setLoading(false);
    }
  };

  const calculateDifferences = (leftData, rightData, leftTerms, rightTerms) => {
    const diffs = [];

    // Compare basic metadata
    if (leftData.status !== rightData.status) {
      diffs.push({
        field: 'Status',
        leftValue: leftData.status,
        rightValue: rightData.status
      });
    }

    if (leftData.expirationDate !== rightData.expirationDate) {
      diffs.push({
        field: 'Expiration Date',
        leftValue: new Date(leftData.expirationDate).toLocaleDateString(),
        rightValue: new Date(rightData.expirationDate).toLocaleDateString()
      });
    }

    // Compare terms using a simple diff approach
    // In a production app, you would use a more sophisticated diff algorithm
    if (leftTerms !== rightTerms) {
      // Split terms into lines for basic comparison
      const leftLines = leftTerms.split('\n');
      const rightLines = rightTerms.split('\n');
      
      diffs.push({
        field: 'Terms',
        type: 'text',
        leftValue: leftTerms,
        rightValue: rightTerms,
        lineChanges: compareLines(leftLines, rightLines)
      });
    }

    setDifferences(diffs);
  };

  // Simple line comparison function
  const compareLines = (leftLines, rightLines) => {
    const changes = [];
    const maxLines = Math.max(leftLines.length, rightLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      if (i >= leftLines.length) {
        // Line added in right version
        changes.push({
          type: 'added',
          lineNumber: i,
          content: rightLines[i]
        });
      } else if (i >= rightLines.length) {
        // Line removed in right version
        changes.push({
          type: 'removed',
          lineNumber: i,
          content: leftLines[i]
        });
      } else if (leftLines[i] !== rightLines[i]) {
        // Line changed
        changes.push({
          type: 'changed',
          lineNumber: i,
          leftContent: leftLines[i],
          rightContent: rightLines[i]
        });
      }
    }
    
    return changes;
  };

  const handleVersionChange = (side, versionId) => {
    const selectedVersion = versions.find(v => v.id === versionId);
    if (side === 'left') {
      setLeftVersion(selectedVersion);
    } else {
      setRightVersion(selectedVersion);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
                You do not have permission to compare BAA versions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Compare BAA Versions
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
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
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Left Version</label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={leftVersion?.id || ''}
                onChange={(e) => handleVersionChange('left', e.target.value)}
              >
                {versions.map((version) => (
                  <option key={`left-${version.id}`} value={version.id}>
                    Version {version.version} - {formatDate(version.timestamp)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Right Version</label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={rightVersion?.id || ''}
                onChange={(e) => handleVersionChange('right', e.target.value)}
              >
                {versions.map((version) => (
                  <option key={`right-${version.id}`} value={version.id}>
                    Version {version.version} - {formatDate(version.timestamp)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Changes</h4>
            
            {differences.length === 0 ? (
              <p className="text-gray-500 italic">No differences found between these versions.</p>
            ) : (
              <div className="space-y-6">
                {differences.map((diff, index) => (
                  <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h5 className="font-medium">{diff.field}</h5>
                    </div>
                    
                    {diff.type === 'text' ? (
                      <div className="grid grid-cols-2 divide-x divide-gray-200">
                        <div className="p-4 bg-red-50">
                          <pre className="whitespace-pre-wrap text-sm">{diff.leftValue}</pre>
                        </div>
                        <div className="p-4 bg-green-50">
                          <pre className="whitespace-pre-wrap text-sm">{diff.rightValue}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 divide-x divide-gray-200">
                        <div className="p-4">
                          <span className="text-sm">{diff.leftValue}</span>
                        </div>
                        <div className="p-4">
                          <span className="text-sm">{diff.rightValue}</span>
                        </div>
                      </div>
                    )}
                    
                    {diff.lineChanges && diff.lineChanges.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                        <h6 className="text-sm font-medium mb-2">Line Changes</h6>
                        <ul className="space-y-1">
                          {diff.lineChanges.map((change, i) => (
                            <li key={i} className="text-xs">
                              {change.type === 'added' && (
                                <span className="text-green-600">
                                  <FiArrowRight className="inline mr-1" />
                                  Added line {change.lineNumber + 1}: {change.content}
                                </span>
                              )}
                              {change.type === 'removed' && (
                                <span className="text-red-600">
                                  <FiArrowLeft className="inline mr-1" />
                                  Removed line {change.lineNumber + 1}: {change.content}
                                </span>
                              )}
                              {change.type === 'changed' && (
                                <span className="text-amber-600">
                                  Line {change.lineNumber + 1} changed from "{change.leftContent}" to "{change.rightContent}"
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BAACompare;