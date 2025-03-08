import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiFileText, FiSearch, FiLock, FiEye, FiClock } from 'react-icons/fi';
import { checkHIPAAAccess } from '../../utils/HIPAACompliance';

export default function MedicalRecordViewer() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setSelectedVersion(record.versions[0]);
    
    AuditService.logTransaction({
      userId: currentUser.id,
      action: 'medical_record_view',
      entityId: record.id,
      entityType: 'emr',
      details: HIPAAEncryptionService.encryptSensitiveData({
        accessedAt: new Date().toISOString(),
        accessedBy: currentUser.id,
        recordType: record.type
      })
    });
  };

  const recordTabs = [
    { id: 'all', label: 'All Records' },
    { id: 'notes', label: 'Clinical Notes' },
    { id: 'labs', label: 'Lab Results' },
    { id: 'imaging', label: 'Imaging' },
    { id: 'prescriptions', label: 'Prescriptions' },
  ];

  const sampleRecords = [
    {
      id: 1,
      type: 'note',
      date: '2024-03-15',
      title: 'Initial Consultation Note',
      author: 'Dr. Smith',
      contentPreview: 'Patient presented with persistent cough...',
      versions: [
        {
          version: 2,
          date: '2024-03-16',
          content: 'Follow-up assessment shows improvement in respiratory symptoms...',
          author: 'Dr. Smith'
        },
        {
          version: 1,
          date: '2024-03-15',
          content: 'Initial presentation with dry cough and fatigue...',
          author: 'Dr. Smith'
        }
      ]
    },
    {
      id: 2,
      type: 'lab',
      date: '2024-03-18',
      title: 'CBC Results',
      author: 'LabCorp',
      contentPreview: 'WBC: 5.6 • RBC: 4.8...'
    }
  ];

  if (!checkHIPAAAccess(currentUser)) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
        <div className="flex items-center">
          <FiLock className="text-red-500 mr-2" />
          <span>You do not have permission to view medical records</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center mb-4 space-x-2">
        <FiFileText className="text-blue-600" />
        <h3 className="text-lg font-semibold">Medical Record Viewer</h3>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {recordTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Filters */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search records..."
            className="w-full p-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <FiClock className="text-gray-400" />
          <input
            type="date"
            className="w-full p-2 border rounded-md"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Record List */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {sampleRecords.map((record) => (
              <tr 
                key={record.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedRecord(record)}
              >
                <td className="px-6 py-4 text-sm text-gray-900">
                  {record.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {record.date}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {record.author}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {record.contentPreview}
                </td>
                <td className="px-6 py-4 text-sm text-blue-600">
                  <FiEye className="inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Pane (To be implemented) */}
      {selectedRecord && (
        <div className="mt-4 border-t pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-semibold">{selectedRecord.title}</h4>
            <select 
              className="p-2 border rounded-md"
              onChange={(e) => setSelectedVersion(
                selectedRecord.versions.find(v => v.version === Number(e.target.value))
              )}
            >
              {selectedRecord.versions.map(version => (
                <option key={version.version} value={version.version}>
                  Version {version.version} - {version.date}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Patient ID:</p>
                <p className="text-gray-600">PT-{selectedRecord.id.toString().padStart(4, '0')}</p>
              </div>
              <div>
                <p className="font-medium">Document Type:</p>
                <p className="text-gray-600 capitalize">{selectedRecord.type}</p>
              </div>
            </div>
            
            <div className="mt-4 prose max-w-none">
              <p className="font-medium mb-2">Clinical Notes:</p>
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedVersion.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}