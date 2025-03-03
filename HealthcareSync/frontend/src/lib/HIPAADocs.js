import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const HIPAADocs = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        category: '',
        description: '',
        file: null
    });
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    
    const { user } = useAuth();
    
    // HIPAA document categories
    const categories = [
        { id: 'policies', name: 'Policies & Procedures' },
        { id: 'forms', name: 'Patient Forms' },
        { id: 'training', name: 'Training Materials' },
        { id: 'compliance', name: 'Compliance Reports' },
        { id: 'audits', name: 'Audit Documentation' },
        { id: 'agreements', name: 'Business Associate Agreements' }
    ];
    
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true);
                // API call would go here
                const response = await fetch('/api/hipaa-docs');
                const data = await response.json();
                
                if (response.ok) {
                    setDocuments(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch HIPAA documents');
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching HIPAA documents:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDocuments();
    }, []);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUploadForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleFileChange = (e) => {
        setUploadForm(prev => ({
            ...prev,
            file: e.target.files[0]
        }));
    };
    
    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        
        if (!uploadForm.file) {
            setError('Please select a file to upload');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('title', uploadForm.title);
            formData.append('category', uploadForm.category);
            formData.append('description', uploadForm.description);
            formData.append('file', uploadForm.file);
            
            // API call would go here
            const response = await fetch('/api/hipaa-docs', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setDocuments(prev => [...prev, data]);
                setShowUploadModal(false);
                // Reset form
                setUploadForm({
                    title: '',
                    category: '',
                    description: '',
                    file: null
                });
            } else {
                throw new Error(data.message || 'Failed to upload document');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error uploading document:', err);
        }
    };
    
    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };
    
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    
    const handleDownload = (documentId) => {
        // In a real implementation, this would trigger a download
        window.open(`/api/hipaa-docs/${documentId}/download`, '_blank');
    };
    
    // Filter documents based on category and search term
    const filteredDocuments = documents.filter(doc => {
        const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             doc.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    
    // Mock data for demonstration
    const mockDocuments = [
        {
            id: '1',
            title: 'HIPAA Privacy Policy',
            category: 'policies',
            description: 'Official privacy policy document outlining patient data protection measures.',
            uploadedBy: 'Admin User',
            uploadDate: '2023-10-15',
            fileSize: '1.2 MB',
            fileType: 'pdf'
        },
        {
            id: '2',
            title: 'Patient Consent Form',
            category: 'forms',
            description: 'Standard consent form for patient information sharing.',
            uploadedBy: 'Admin User',
            uploadDate: '2023-09-22',
            fileSize: '245 KB',
            fileType: 'docx'
        },
        {
            id: '3',
            title: 'HIPAA Staff Training Guide',
            category: 'training',
            description: 'Comprehensive training materials for healthcare staff on HIPAA compliance.',
            uploadedBy: 'Training Manager',
            uploadDate: '2023-11-05',
            fileSize: '4.5 MB',
            fileType: 'pdf'
        },
        {
            id: '4',
            title: 'Quarterly Compliance Report Q3 2023',
            category: 'compliance',
            description: 'Detailed report on HIPAA compliance metrics for Q3 2023.',
            uploadedBy: 'Compliance Officer',
            uploadDate: '2023-10-01',
            fileSize: '3.1 MB',
            fileType: 'pdf'
        },
        {
            id: '5',
            title: 'Security Audit Documentation',
            category: 'audits',
            description: 'Results and findings from the annual security audit.',
            uploadedBy: 'Security Officer',
            uploadDate: '2023-08-15',
            fileSize: '2.8 MB',
            fileType: 'pdf'
        },
        {
            id: '6',
            title: 'Lab Services Business Associate Agreement',
            category: 'agreements',
            description: 'Formal agreement with external laboratory services provider.',
            uploadedBy: 'Legal Department',
            uploadDate: '2023-07-10',
            fileSize: '1.5 MB',
            fileType: 'pdf'
        }
    ];
    
    if (loading) return <div className="flex justify-center items-center h-64"><p>Loading documents...</p></div>;
    
    // Use mock data if no documents are fetched
    const displayDocuments = documents.length > 0 ? filteredDocuments : mockDocuments.filter(doc => {
        const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             doc.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">HIPAA Documentation</h1>
            
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                    {error}
                    <button 
                        className="ml-2 text-red-700 hover:text-red-900"
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}
            
            <div className="bg-white p-4 rounded shadow mb-6">
                <div className="flex flex-wrap justify-between items-center">
                    <div className="flex space-x-4 mb-4 md:mb-0">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select 
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                className="p-2 border rounded"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium mb-1">Search</label>
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search documents..."
                                className="p-2 border rounded w-full"
                            />
                        </div>
                    </div>
                    
                    {user && (user.role === 'admin' || user.role === 'compliance_officer') && (
                        <button 
                            onClick={() => setShowUploadModal(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Upload Document
                        </button>
                    )}
                </div>
            </div>
            
            <div className="bg-white rounded shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-3 px-4 border-b text-left">Title</th>
                                <th className="py-3 px-4 border-b text-left">Category</th>
                                <th className="py-3 px-4 border-b text-left">Description</th>
                                <th className="py-3 px-4 border-b text-left">Uploaded By</th>
                                <th className="py-3 px-4 border-b text-left">Date</th>
                                <th className="py-3 px-4 border-b text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayDocuments.length > 0 ? (
                                displayDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 border-b">
                                            <div className="flex items-center">
                                                <div className="mr-3">
                                                    {doc.fileType === 'pdf' && (
                                                        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    {doc.fileType === 'docx' && (
                                                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="font-medium">{doc.title}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 border-b">
                                            {categories.find(cat => cat.id === doc.category)?.name || doc.category}
                                        </td>
                                        <td className="py-3 px-4 border-b">
                                            <p className="truncate max-w-xs">{doc.description}</p>
                                        </td>
                                        <td className="py-3 px-4 border-b">{doc.uploadedBy}</td>
                                        <td className="py-3 px-4 border-b">{doc.uploadDate}</td>
                                        <td className="py-3 px-4 border-b">
                                            <button 
                                                onClick={() => handleDownload(doc.id)}
                                                className="text-blue-500 hover:text-blue-700 mr-3"
                                            >
                                                Download
                                            </button>
                                            {user && (user.role === 'admin' || user.role === 'compliance_officer') && (
                                                <button className="text-red-500 hover:text-red-700">
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-4 text-center">No documents found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Upload HIPAA Document</h2>
                            <button 
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleUploadSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input 
                                    type="text"
                                    name="title"
                                    value={uploadForm.title}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select 
                                    name="category"
                                    value={uploadForm.category}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea 
                                    name="description"
                                    value={uploadForm.description}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    rows="3"
                                    required
                                ></textarea>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">File</label>
                                <input 
                                    type="file"
                                    onChange={handleFileChange}
                                    className="w-full p-2 border rounded"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX, XLS, XLSX</p>
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HIPAADocs; 