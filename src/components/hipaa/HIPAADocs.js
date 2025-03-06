import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiFileText, FiDownload, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { logHIPAAAction, checkHIPAAAccess } from '../../utils/hipaaCompliance';
import { trackDocumentAccess, validateDocumentAccess } from '../../utils/hipaaAudit';

const HIPAADocs = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hipaa-documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch HIPAA documents');
      }

      const data = await response.json();
      setDocuments(data);

      // Log this access for HIPAA auditing
      // Log document access in audit trail
      await trackDocumentAccess('all', 'list', currentUser);
      await logHIPAAAction('access_hipaa_documents', {
        documentCount: data.length,
        userRole: currentUser.role
      }, currentUser.id);

    } catch (err) {
      console.error('Error fetching HIPAA documents:', err);
      setError('Failed to load HIPAA documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId) => {
    try {
      if (!checkHIPAAAccess(currentUser) || !validateDocumentAccess({ requiredPermission: 'download' }, currentUser)) {
        throw new Error('You do not have permission to download HIPAA documents');
      }

      const response = await fetch(`/api/hipaa-documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hipaa-document-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Log document access and download in audit trail
      await trackDocumentAccess(documentId, 'download', currentUser);
      await logHIPAAAction('download_hipaa_document', {
        documentId,
        userRole: currentUser.role
      }, currentUser.id);

    } catch (error) {
      console.error('Error downloading document:', error);
      setError(error.message);
    }
  };

  if (!checkHIPAAAccess(currentUser)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center text-red-600 mb-4">
            <FiLock className="w-6 h-6 mr-2" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
          </div>
          <p className="text-gray-600">
            You do not have permission to view HIPAA documents. This feature is only available to authorized healthcare providers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FiFileText className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-semibold text-gray-800">HIPAA Documentation</h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-center">
                <FiAlertTriangle className="text-red-500 mr-3" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <FiDownload className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HIPAADocs;