import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

const InvoiceList = ({ 
    invoices, 
    onViewInvoice, 
    onPayInvoice, 
    onDeleteInvoice, 
    searchTerm, 
    statusFilter, 
    dateFilter 
}) => {
    const { user } = useAuth();
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    
    // Sort invoices
    const sortedInvoices = useMemo(() => {
        if (!invoices) return [];
        
        const sortableInvoices = [...invoices];
        
        sortableInvoices.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        
        return sortableInvoices;
    }, [invoices, sortConfig]);
    
    // Filter invoices based on search term, status, and date
    const filteredInvoices = useMemo(() => {
        if (!sortedInvoices) return [];
        
        return sortedInvoices.filter(invoice => {
            // Search term filter
            const matchesSearch = searchTerm === '' || 
                invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter
            const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
            
            // Date filter
            let matchesDate = true;
            if (dateFilter === 'last30') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                matchesDate = new Date(invoice.date) >= thirtyDaysAgo;
            } else if (dateFilter === 'last90') {
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                matchesDate = new Date(invoice.date) >= ninetyDaysAgo;
            } else if (dateFilter === 'thisYear') {
                const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
                matchesDate = new Date(invoice.date) >= firstDayOfYear;
            }
            
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [sortedInvoices, searchTerm, statusFilter, dateFilter]);
    
    // Handle column sort
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    
    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };
    
    // HIPAA logging
    const logHIPAAEvent = (event) => {
        console.log(`HIPAA Log: ${event}`);
        // In a production environment, this would be sent to a secure logging service
    };
    
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            {filteredInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('invoiceNumber')}
                                >
                                    <div className="flex items-center">
                                        Invoice #
                                        {sortConfig.key === 'invoiceNumber' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('patientName')}
                                >
                                    <div className="flex items-center">
                                        Patient
                                        {sortConfig.key === 'patientName' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('date')}
                                >
                                    <div className="flex items-center">
                                        Date
                                        {sortConfig.key === 'date' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('amount')}
                                >
                                    <div className="flex items-center">
                                        Amount
                                        {sortConfig.key === 'amount' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status
                                        {sortConfig.key === 'status' && (
                                            <span className="ml-1">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {invoice.invoiceNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {invoice.patientName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(invoice.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatCurrency(invoice.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => {
                                                onViewInvoice(invoice);
                                                logHIPAAEvent(`User ${user.id} viewed invoice ${invoice.invoiceNumber}`);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            View
                                        </button>
                                        
                                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                            <button 
                                                onClick={() => {
                                                    onPayInvoice(invoice);
                                                    logHIPAAEvent(`User ${user.id} initiated payment for invoice ${invoice.invoiceNumber}`);
                                                }}
                                                className="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                Pay
                                            </button>
                                        )}
                                        
                                        {(user?.role === 'admin' || user?.role === 'billing_staff') && (
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this invoice?')) {
                                                        onDeleteInvoice(invoice.id);
                                                        logHIPAAEvent(`User ${user.id} deleted invoice ${invoice.invoiceNumber}`);
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6 text-center">
                    <p className="text-gray-500">No invoices found matching your filters.</p>
                </div>
            )}
        </div>
    );
};

export default InvoiceList; 