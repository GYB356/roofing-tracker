import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import InvoiceList from '../components/billing/InvoiceList';
import PaymentMethods from '../components/billing/PaymentMethods';
import InsuranceModal from '../components/billing/InsuranceModal';

const Billing = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [invoiceForm, setInvoiceForm] = useState({
        patientId: '',
        patientName: '',
        description: '',
        amount: '',
        dueDate: '',
        insuranceProvider: '',
        insuranceCoverage: '',
        notes: ''
    });
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
    });
    const [insuranceDetails, setInsuranceDetails] = useState([]);
    const [selectedInsurance, setSelectedInsurance] = useState(null);
    const [showInsuranceModal, setShowInsuranceModal] = useState(false);
    const [insuranceForm, setInsuranceForm] = useState({
        provider: '',
        policyNumber: '',
        document: null
    });

    const { user } = useAuth();
    const socket = useSocket();
    
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setLoading(true);
                // API call would go here
                const response = await fetch('/api/invoices');
                const data = await response.json();
                
                if (response.ok) {
                    setInvoices(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch invoices');
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching invoices:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchInvoices();

        // Fetch payment methods
        const fetchPaymentMethods = async () => {
            try {
                const response = await fetch('/api/payment-methods');
                const data = await response.json();
                if (response.ok) {
                    setPaymentMethods(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch payment methods');
                }
            } catch (err) {
                console.error('Error fetching payment methods:', err);
            }
        };

        fetchPaymentMethods();

        // Listen for real-time updates
        socket.on('invoiceUpdated', (updatedInvoice) => {
            setInvoices((prev) => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
        });

        socket.on('paymentMethodUpdated', (updatedMethod) => {
            setPaymentMethods((prev) => prev.map(method => method.id === updatedMethod.id ? updatedMethod : method));
        });

        socket.on('paymentMethodDeleted', (deletedMethodId) => {
            setPaymentMethods((prev) => prev.filter(method => method.id !== deletedMethodId));
        });

        return () => {
            socket.off('invoiceUpdated');
            socket.off('paymentMethodUpdated');
            socket.off('paymentMethodDeleted');
        };
    }, [socket]);
    
    // Memoize filtered invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            // Status filter
            if (statusFilter !== 'all' && invoice.status !== statusFilter) {
                return false;
            }
            
            // Date filter
            if (dateFilter && new Date(invoice.dueDate).toISOString().split('T')[0] !== dateFilter) {
                return false;
            }
            
            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    invoice.patientName.toLowerCase().includes(query) ||
                    invoice.id.toLowerCase().includes(query) ||
                    invoice.description.toLowerCase().includes(query)
                );
            }
            
            return true;
        });
    }, [invoices, statusFilter, dateFilter, searchQuery]);
    
    // Memoize handle functions
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setInvoiceForm(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);
    
    const handleCreateSubmit = useCallback(async (e) => {
        e.preventDefault();
        try {
            // API call would go here
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Security-Token': 'your-security-token'
                },
                body: JSON.stringify(invoiceForm)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setInvoices(prev => [...prev, data]);
                // Reset form and close modal
                setInvoiceForm({
                    patientId: '',
                    patientName: '',
                    description: '',
                    amount: '',
                    dueDate: '',
                    insuranceProvider: '',
                    insuranceCoverage: '',
                    notes: ''
                });
                setShowCreateModal(false);
            } else {
                throw new Error(data.message || 'Failed to create invoice');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error creating invoice:', err);
        }
    }, [invoiceForm]);
    
    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
    };
    
    const handleDateChange = (e) => {
        setDateFilter(e.target.value);
    };
    
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };
    
    const handleInvoiceClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceModal(true);
    };
    
    const handlePayInvoice = async (invoiceId) => {
        try {
            // API call would go here
            const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Update the invoice in the list
                setInvoices(prev => 
                    prev.map(inv => 
                        inv.id === invoiceId ? { ...inv, status: 'paid', paidDate: new Date().toISOString() } : inv
                    )
                );
                
                // Update selected invoice if it's the one being paid
                if (selectedInvoice && selectedInvoice.id === invoiceId) {
                    setSelectedInvoice({ 
                        ...selectedInvoice, 
                        status: 'paid', 
                        paidDate: new Date().toISOString() 
                    });
                }
            } else {
                throw new Error(data.message || 'Failed to process payment');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error processing payment:', err);
        }
    };
    
    const handleDeleteInvoice = async (invoiceId) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) {
            return;
        }
        
        try {
            // API call would go here
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove the invoice from the list
                setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
                
                // Close the modal if the deleted invoice was selected
                if (selectedInvoice && selectedInvoice.id === invoiceId) {
                    setShowInvoiceModal(false);
                    setSelectedInvoice(null);
                }
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete invoice');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error deleting invoice:', err);
        }
    };
    
    // Add input validation
    const validateInput = (input) => {
        // Basic validation logic
        return input && input.trim() !== '';
    };

    // Example of HIPAA logging
    const logHIPAAEvent = (event) => {
        console.log(`HIPAA Log: ${event}`);
    };

    // Use logHIPAAEvent in sensitive operations
    useEffect(() => {
        logHIPAAEvent('Fetched invoices');
    }, [invoices]);
    
    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddPaymentMethod = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/payment-methods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentForm)
            });
            const data = await response.json();
            if (response.ok) {
                setPaymentMethods(prev => [...prev, data]);
                setShowPaymentModal(false);
                setPaymentForm({
                    cardNumber: '',
                    cardHolder: '',
                    expiryDate: '',
                    cvv: ''
                });
            } else {
                throw new Error(data.message || 'Failed to add payment method');
            }
        } catch (err) {
            console.error('Error adding payment method:', err);
        }
    };

    const handleEditPaymentMethod = async (methodId) => {
        try {
            const response = await fetch(`/api/payment-methods/${methodId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentForm)
            });
            const data = await response.json();
            if (response.ok) {
                setPaymentMethods(prev => prev.map(method => method.id === methodId ? data : method));
                setShowPaymentModal(false);
                setPaymentForm({
                    cardNumber: '',
                    cardHolder: '',
                    expiryDate: '',
                    cvv: ''
                });
            } else {
                throw new Error(data.message || 'Failed to edit payment method');
            }
        } catch (err) {
            console.error('Error editing payment method:', err);
        }
    };

    const handleDeletePaymentMethod = async (methodId) => {
        if (!window.confirm('Are you sure you want to delete this payment method?')) {
            return;
        }
        try {
            const response = await fetch(`/api/payment-methods/${methodId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete payment method');
            }
        } catch (err) {
            console.error('Error deleting payment method:', err);
        }
    };
    
    // Add missing insurance handlers
    const handleAddInsurance = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('provider', insuranceForm.provider);
            formData.append('policyNumber', insuranceForm.policyNumber);
            if (insuranceForm.document) {
                formData.append('document', insuranceForm.document);
            }
            
            const response = await fetch('/api/insurance', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setInsuranceDetails(prev => [...prev, data]);
                setShowInsuranceModal(false);
                setInsuranceForm({
                    provider: '',
                    policyNumber: '',
                    document: null
                });
            } else {
                throw new Error(data.message || 'Failed to add insurance');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error adding insurance:', err);
        }
    };
    
    const handleEditInsurance = async (insuranceId) => {
        try {
            const formData = new FormData();
            formData.append('provider', insuranceForm.provider);
            formData.append('policyNumber', insuranceForm.policyNumber);
            if (insuranceForm.document) {
                formData.append('document', insuranceForm.document);
            }
            
            const response = await fetch(`/api/insurance/${insuranceId}`, {
                method: 'PUT',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setInsuranceDetails(prev => 
                    prev.map(ins => ins.id === insuranceId ? data : ins)
                );
                setShowInsuranceModal(false);
                setInsuranceForm({
                    provider: '',
                    policyNumber: '',
                    document: null
                });
            } else {
                throw new Error(data.message || 'Failed to update insurance');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error updating insurance:', err);
        }
    };
    
    const handleDeleteInsurance = async (insuranceId) => {
        if (!window.confirm('Are you sure you want to delete this insurance?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/insurance/${insuranceId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setInsuranceDetails(prev => 
                    prev.filter(ins => ins.id !== insuranceId)
                );
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete insurance');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error deleting insurance:', err);
        }
    };
    
    // Fetch insurance details
    useEffect(() => {
        const fetchInsuranceDetails = async () => {
            try {
                const response = await fetch('/api/insurance');
                const data = await response.json();
                
                if (response.ok) {
                    setInsuranceDetails(data);
                } else {
                    throw new Error(data.message || 'Failed to fetch insurance details');
                }
            } catch (err) {
                console.error('Error fetching insurance details:', err);
            }
        };
        
        fetchInsuranceDetails();
        
        // Listen for real-time updates
        socket.on('insuranceUpdated', (updatedInsurance) => {
            setInsuranceDetails((prev) => 
                prev.map(ins => ins.id === updatedInsurance.id ? updatedInsurance : ins)
            );
        });
        
        socket.on('insuranceDeleted', (deletedInsuranceId) => {
            setInsuranceDetails((prev) => 
                prev.filter(ins => ins.id !== deletedInsuranceId)
            );
        });
        
        return () => {
            socket.off('insuranceUpdated');
            socket.off('insuranceDeleted');
        };
    }, [socket]);
    
    if (loading) return <div className="flex justify-center items-center h-64"><p>Loading invoices...</p></div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
    
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6" aria-label="Billing Management">Billing Management</h1>
            
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            id="statusFilter"
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className="p-2 border rounded w-full md:w-auto"
                            aria-label="Filter by status"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input
                            type="date"
                            id="dateFilter"
                            value={dateFilter}
                            onChange={handleDateChange}
                            className="p-2 border rounded w-full md:w-auto"
                            aria-label="Filter by due date"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            id="searchQuery"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by patient name or ID"
                            className="p-2 border rounded w-full md:w-auto"
                            aria-label="Search invoices"
                        />
                    </div>
                </div>
                
                {(user?.role === 'admin' || user?.role === 'billing') && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4 md:mt-0"
                        aria-label="Create new invoice"
                    >
                        Create New Invoice
                    </button>
                )}
            </div>
            
            <InvoiceList 
                invoices={invoices}
                loading={loading}
                error={error}
                statusFilter={statusFilter}
                dateFilter={dateFilter}
                searchQuery={searchQuery}
                handleInvoiceClick={handleInvoiceClick}
                handlePayInvoice={handlePayInvoice}
                handleDeleteInvoice={handleDeleteInvoice}
            />
            
            {/* Invoice Details Modal */}
            {showInvoiceModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold mb-4" aria-label="Invoice Details">Invoice Details</h2>
                                <button 
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-label="Close invoice details"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                                        <p className="text-lg">{selectedInvoice.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Status</p>
                                        <p className={`text-lg font-semibold
                                            ${selectedInvoice.status === 'paid' ? 'text-green-600' : ''}
                                            ${selectedInvoice.status === 'pending' ? 'text-yellow-600' : ''}
                                            ${selectedInvoice.status === 'overdue' ? 'text-red-600' : ''}
                                            ${selectedInvoice.status === 'cancelled' ? 'text-gray-600' : ''}
                                        `}>
                                            {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Patient Name</p>
                                        <p className="text-lg">{selectedInvoice.patientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Patient ID</p>
                                        <p className="text-lg">{selectedInvoice.patientId}</p>
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-500">Description</p>
                                    <p className="text-lg">{selectedInvoice.description}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Amount</p>
                                        <p className="text-lg font-bold">${parseFloat(selectedInvoice.amount).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Issue Date</p>
                                        <p className="text-lg">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Due Date</p>
                                        <p className="text-lg">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                
                                {selectedInvoice.insuranceProvider && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Insurance Provider</p>
                                            <p className="text-lg">{selectedInvoice.insuranceProvider}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Insurance Coverage</p>
                                            <p className="text-lg">{selectedInvoice.insuranceCoverage}%</p>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedInvoice.notes && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-500">Notes</p>
                                        <p className="text-lg">{selectedInvoice.notes}</p>
                                    </div>
                                )}
                                
                                {selectedInvoice.paidDate && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-500">Payment Date</p>
                                        <p className="text-lg">{new Date(selectedInvoice.paidDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end mt-6 space-x-3">
                                {(user?.role === 'patient' && selectedInvoice.status === 'pending') && (
                                    <button 
                                        onClick={() => handlePayInvoice(selectedInvoice.id)}
                                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                        aria-label="Pay invoice"
                                    >
                                        Pay Now
                                    </button>
                                )}
                                
                                {(user?.role === 'admin' || user?.role === 'billing') && (
                                    <button 
                                        onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                        aria-label="Delete invoice"
                                    >
                                        Delete Invoice
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                                    aria-label="Close invoice details"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Create Invoice Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold mb-4" aria-label="Create New Invoice">Create New Invoice</h2>
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-label="Close create invoice form"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreateSubmit} className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
                                            Patient ID
                                        </label>
                                        <input
                                            type="text"
                                            id="patientId"
                                            name="patientId"
                                            value={invoiceForm.patientId}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                            required
                                            aria-label="Patient ID"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Patient Name
                                        </label>
                                        <input
                                            type="text"
                                            id="patientName"
                                            name="patientName"
                                            value={invoiceForm.patientName}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                            required
                                            aria-label="Patient Name"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        id="description"
                                        name="description"
                                        value={invoiceForm.description}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                        required
                                        aria-label="Description"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount ($)
                                        </label>
                                        <input
                                            type="number"
                                            id="amount"
                                            name="amount"
                                            value={invoiceForm.amount}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            className="w-full p-2 border rounded"
                                            required
                                            aria-label="Amount"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            id="dueDate"
                                            name="dueDate"
                                            value={invoiceForm.dueDate}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                            required
                                            aria-label="Due Date"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 mb-1">
                                            Insurance Provider
                                        </label>
                                        <input
                                            type="text"
                                            id="insuranceProvider"
                                            name="insuranceProvider"
                                            value={invoiceForm.insuranceProvider}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded"
                                            aria-label="Insurance Provider"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="insuranceCoverage" className="block text-sm font-medium text-gray-700 mb-1">
                                            Insurance Coverage (%)
                                        </label>
                                        <input
                                            type="number"
                                            id="insuranceCoverage"
                                            name="insuranceCoverage"
                                            value={invoiceForm.insuranceCoverage}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                            className="w-full p-2 border rounded"
                                            aria-label="Insurance Coverage"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={invoiceForm.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full p-2 border rounded"
                                        aria-label="Notes"
                                    ></textarea>
                                </div>
                                
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                                        aria-label="Cancel create invoice"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                        aria-label="Submit new invoice"
                                    >
                                        Create Invoice
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <PaymentMethods 
                paymentMethods={paymentMethods}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                setShowPaymentModal={setShowPaymentModal}
                handleDeletePaymentMethod={handleDeletePaymentMethod}
            />

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold mb-4" aria-label="{selectedPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}">{selectedPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
                                <button 
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-label="Close payment method form"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <form onSubmit={selectedPaymentMethod ? () => handleEditPaymentMethod(selectedPaymentMethod.id) : handleAddPaymentMethod} className="mt-4">
                                <div className="mb-4">
                                    <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 mb-1">
                                        Card Holder
                                    </label>
                                    <input
                                        type="text"
                                        id="cardHolder"
                                        name="cardHolder"
                                        value={paymentForm.cardHolder}
                                        onChange={handlePaymentInputChange}
                                        className="w-full p-2 border rounded"
                                        required
                                        aria-label="Card Holder"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        Card Number
                                    </label>
                                    <input
                                        type="text"
                                        id="cardNumber"
                                        name="cardNumber"
                                        value={paymentForm.cardNumber}
                                        onChange={handlePaymentInputChange}
                                        className="w-full p-2 border rounded"
                                        required
                                        aria-label="Card Number"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            id="expiryDate"
                                            name="expiryDate"
                                            value={paymentForm.expiryDate}
                                            onChange={handlePaymentInputChange}
                                            className="w-full p-2 border rounded"
                                            placeholder="MM/YY"
                                            required
                                            aria-label="Expiry Date"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                                            CVV
                                        </label>
                                        <input
                                            type="password"
                                            id="cvv"
                                            name="cvv"
                                            value={paymentForm.cvv}
                                            onChange={handlePaymentInputChange}
                                            className="w-full p-2 border rounded"
                                            required
                                            aria-label="CVV"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                                        aria-label="Cancel payment method form"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                        aria-label="Submit payment method"
                                    >
                                        {selectedPaymentMethod ? 'Save Changes' : 'Add Method'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Insurance Section */}
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4" aria-label="Insurance Information">Insurance Information</h2>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Provider
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Policy Number
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Document
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {insuranceDetails.length > 0 ? (
                                    insuranceDetails.map((insurance) => (
                                        <tr key={insurance.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {insurance.provider}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {insurance.policyNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {insurance.documentUrl ? (
                                                    <a 
                                                        href={insurance.documentUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View Document
                                                    </a>
                                                ) : (
                                                    "No document"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button 
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                    onClick={() => {
                                                        setSelectedInsurance(insurance);
                                                        setInsuranceForm({
                                                            provider: insurance.provider,
                                                            policyNumber: insurance.policyNumber,
                                                            document: null
                                                        });
                                                        setShowInsuranceModal(true);
                                                    }}
                                                    aria-label={`Edit insurance for ${insurance.provider}`}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="text-red-600 hover:text-red-900"
                                                    onClick={() => handleDeleteInsurance(insurance.id)}
                                                    aria-label={`Delete insurance for ${insurance.provider}`}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No insurance information found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {(user?.role === 'admin' || user?.role === 'billing' || user?.role === 'patient') && (
                    <button
                        onClick={() => {
                            setSelectedInsurance(null);
                            setInsuranceForm({
                                provider: '',
                                policyNumber: '',
                                document: null
                            });
                            setShowInsuranceModal(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
                        aria-label="Add new insurance"
                    >
                        Add Insurance
                    </button>
                )}
            </div>
            
            <InsuranceModal 
                showInsuranceModal={showInsuranceModal}
                setShowInsuranceModal={setShowInsuranceModal}
                insuranceForm={insuranceForm}
                setInsuranceForm={setInsuranceForm}
                selectedInsurance={selectedInsurance}
                handleAddInsurance={handleAddInsurance}
                handleEditInsurance={handleEditInsurance}
            />
        </div>
    );
};

export default Billing; 