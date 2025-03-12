import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CreditCardIcon, 
  CashIcon, 
  ArrowLeftIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/outline';
import { billingAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/billing-utils';

const InvoicePayment = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const fetchInvoiceAndPaymentMethods = async () => {
      try {
        setLoading(true);
        
        // Fetch invoice details
        const invoiceResponse = await billingAPI.getInvoiceById(invoiceId);
        setInvoice(invoiceResponse.data);
        
        // Set default payment amount to balance
        setPaymentAmount(invoiceResponse.data.balance.toString());
        
        // Fetch payment methods
        const paymentMethodsResponse = await billingAPI.getPaymentMethods();
        setPaymentMethods(paymentMethodsResponse.data);
        
        // Set default payment method if available
        if (paymentMethodsResponse.data.length > 0) {
          const defaultMethod = paymentMethodsResponse.data.find(method => method.isDefault) || paymentMethodsResponse.data[0];
          setSelectedPaymentMethod(defaultMethod._id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load invoice data. Please try again later.'
        );
        setLoading(false);
      }
    };
    
    fetchInvoiceAndPaymentMethods();
  }, [invoiceId]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMMM d, yyyy');
  };
  
  // Handle payment amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    
    // Only allow numbers and decimal point
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setPaymentAmount(value);
    }
  };
  
  // Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    
    if (amount > invoice.balance) {
      setError('Payment amount cannot exceed the invoice balance');
      return;
    }
    
    try {
      setProcessingPayment(true);
      setError('');
      
      // Get payment method details
      const paymentMethod = paymentMethods.find(method => method._id === selectedPaymentMethod);
      
      // Prepare payment data
      const paymentData = {
        amount,
        paymentMethod: paymentMethod.type,
        paymentReference,
        notes
      };
      
      // Process payment
      await billingAPI.payInvoice(invoiceId, paymentData);
      
      setSuccess('Payment processed successfully!');
      setProcessingPayment(false);
      
      // Redirect to invoice details after a delay
      setTimeout(() => {
        navigate(`/billing/invoices/${invoiceId}`);
      }, 2000);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(
        err.response?.data?.message || 
        'Failed to process payment. Please try again later.'
      );
      setProcessingPayment(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error && !invoice) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
            <div className="mt-4">
              <Link
                to="/billing"
                className="text-sm font-medium text-red-800 hover:text-red-700"
              >
                &larr; Back to Billing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invoice not found.</p>
        <Link
          to="/billing"
          className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Billing
        </Link>
      </div>
    );
  }
  
  // If invoice is already paid
  if (invoice.status === 'Paid') {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Make Payment</h2>
        </div>
        
        <div className="p-6 text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Already Paid</h3>
          <p className="text-gray-600 mb-6">
            This invoice has been fully paid. Thank you for your payment.
          </p>
          <div className="mt-4">
            <Link
              to={`/billing/invoices/${invoiceId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              View Invoice Details
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-800">Make Payment</h2>
          <p className="text-sm text-gray-500 mt-1">
            Invoice #{invoice.invoiceNumber}
          </p>
        </div>
        <div>
          <Link
            to={`/billing/invoices/${invoiceId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Invoice
          </Link>
        </div>
      </div>
      
      <div className="p-6">
        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Invoice summary */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">Invoice Summary</h3>
          <div className="bg-gray-50 rounded-md p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="text-md font-medium">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-md font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-md font-medium">{formatCurrency(invoice.total)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="text-md font-medium">{formatCurrency(invoice.amountPaid)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Balance Due</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(invoice.balance)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment form */}
        <form onSubmit={handleSubmit}>
          {/* Payment method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
            
            {paymentMethods.length === 0 ? (
              <div className="text-center p-4 border border-dashed border-gray-300 rounded-md">
                <p className="text-sm text-gray-500">No payment methods found.</p>
                <Link
                  to="/billing/payment-methods/new"
                  className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Payment Method
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paymentMethods.map(method => (
                  <div key={method._id}>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method._id}
                        checked={selectedPaymentMethod === method._id}
                        onChange={() => setSelectedPaymentMethod(method._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        {method.type === 'Credit Card' || method.type === 'Debit Card' ? (
                          <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                        ) : (
                          <CashIcon className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {method.type}
                            {method.isDefault && <span className="ml-2 text-xs text-blue-600">(Default)</span>}
                          </p>
                          {(method.type === 'Credit Card' || method.type === 'Debit Card') && (
                            <p className="text-xs text-gray-500">
                              {method.cardBrand} •••• {method.last4}
                              {method.expiryMonth && method.expiryYear && (
                                <span> • Expires {method.expiryMonth}/{method.expiryYear}</span>
                              )}
                            </p>
                          )}
                          {method.type === 'Bank Account' && (
                            <p className="text-xs text-gray-500">
                              {method.bankName} •••• {method.accountLast4}
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
                
                <div className="mt-2">
                  <Link
                    to="/billing/payment-methods/new"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Payment Method
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Payment amount */}
          <div className="mb-6">
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                name="paymentAmount"
                id="paymentAmount"
                value={paymentAmount}
                onChange={handleAmountChange}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                aria-describedby="price-currency"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  USD
                </span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Balance due: {formatCurrency(invoice.balance)}
            </p>
          </div>
          
          {/* Payment reference */}
          <div className="mb-6">
            <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Reference (Optional)
            </label>
            <input
              type="text"
              name="paymentReference"
              id="paymentReference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="e.g., Check number, transaction ID"
            />
          </div>
          
          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Add any additional notes about this payment"
            />
          </div>
          
          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={processingPayment || !selectedPaymentMethod}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                processingPayment || !selectedPaymentMethod
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {processingPayment ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Make Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoicePayment; 