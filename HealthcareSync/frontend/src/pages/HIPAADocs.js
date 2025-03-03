import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const HIPAADocs = () => {
    const { user, hasRole } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [acknowledgments, setAcknowledgments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!hasRole(['admin', 'compliance'])) {
            setError('Access Denied');
            return;
        }

        fetchDocuments();
        if (user) {
            fetchAcknowledgments();
        }
    }, [hasRole, user]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/hipaa/documents');
            setDocuments(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load HIPAA documents');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAcknowledgments = async () => {
        try {
            const response = await axios.get(`/api/hipaa/acknowledgments?userId=${user.id}`);
            setAcknowledgments(response.data);
        } catch (err) {
            console.error('Failed to load acknowledgments:', err);
        }
    };

    const handleAcknowledge = async (documentId) => {
        try {
            await axios.post('/api/hipaa/acknowledgments', {
                documentId,
                userId: user.id
            });
            await fetchAcknowledgments();
            setShowModal(false);
        } catch (err) {
            setError('Failed to acknowledge document');
            console.error(err);
        }
    };

    const isDocumentAcknowledged = (documentId) => {
        return acknowledgments.some(ack => ack.documentId === documentId);
    };

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading HIPAA documents...</p>
                </div>
            </div>
        );
    }

    if (!documents.length) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-800 text-white">
                        <h2 className="text-xl font-semibold">HIPAA Documentation</h2>
                        <p className="mt-1 text-sm text-gray-300">
                            Review and acknowledge important HIPAA compliance documents
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {error && (
                            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="bg-white border rounded-lg shadow-sm overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <svg
                                                    className="h-8 w-8 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                                <div className="ml-4">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {doc.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        Version {doc.version}
                                                    </p>
                                                </div>
                                            </div>
                                            {isDocumentAcknowledged(doc.id) && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Acknowledged
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedDoc(doc);
                                                    setShowModal(true);
                                                }}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                View Document
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Modal */}
            {showModal && selectedDoc && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedDoc.title}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-4 prose max-w-none">
                            {selectedDoc.content}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Close
                            </button>
                            {!isDocumentAcknowledged(selectedDoc.id) && (
                                <button
                                    onClick={() => handleAcknowledge(selectedDoc.id)}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Acknowledge
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HIPAADocs; 