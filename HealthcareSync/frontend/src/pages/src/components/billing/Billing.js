import React, { useContext, useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiCreditCard, FiLock } from 'react-icons/fi';
import { AuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import InvoiceList from './InvoiceList';
import PaymentMethods from './PaymentMethods';
import InvoiceFilter from './InvoiceFilter';
import InsuranceForm from './InsuranceForm';

// Lazy load modals
const InsuranceModal = React.lazy(() => import('./InsuranceModal'));
const PaymentMethodForm = React.lazy(() => import('./PaymentMethodForm'));

const Billing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [insuranceData, setInsuranceData] = useState([]);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';
  const isStaff = useMemo(() => isAdmin || isDoctor, [isAdmin, isDoctor]);

  // Add security headers to fetch requests
  const fetchWithSecurityHeaders = async (url, options = {}) => {
    const defaultHeaders = {
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';",
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    const headers = { ...defaultHeaders, ...options.headers };
    return fetch(url, { ...options, headers });
  };

  // Add client-side input validation for payment method form
  const validatePaymentMethod = (paymentData) => {
    const { cardType, cardNumber, expiryMonth, expiryYear, cvv, billingName } = paymentData;
    if (!cardType || !cardNumber || !expiryMonth || !expiryYear || !cvv || !billingName) {
      throw new Error('All fields are required.');
    }
    if (!/^[0-9]{16}$/.test(cardNumber)) {
      throw new Error('Invalid card number.');
    }
    if (!/^[0-9]{3,4}$/.test(cvv)) {
      throw new Error('Invalid CVV.');
    }
    // Additional validation rules can be added here
  };

  // Enhance HIPAA compliance logging
  const logHipaaAccess = (action, resourceType = 'billing') => {
    socket.emit('hipaa:log-access', {
      resourceType,
      action,
      timestamp: new Date()
    });
  };

  // Memoize fetchData to prevent unnecessary re-creations
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isStaff) {
        const patientsResponse = await fetchWithSecurityHeaders('/api/patients');
        
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          setPatientList(patientsData);
        } else {
          throw new Error('Failed to fetch patients');
        }
      }

      const patientId = isPatient ? user.id : selectedPatientId;
      
      const endpoint = patientId 
        ? `/api/billing/invoices?patientId=${patientId}` 
        : '/api/billing/invoices';
        
      const invoicesResponse = await fetchWithSecurityHeaders(endpoint);

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);
      } else {
        throw new Error('Failed to fetch invoices');
      }

      if (patientId) {
        const paymentMethodsResponse = await fetchWithSecurityHeaders(`/api/billing/payment-methods?patientId=${patientId}`);

        if (paymentMethodsResponse.ok) {
          const paymentMethodsData = await paymentMethodsResponse.json();
          setPaymentMethods(paymentMethodsData);
        } else {
          throw new Error('Failed to fetch payment methods');
        }

        const insuranceResponse = await fetchWithSecurityHeaders(`/api/insurance?patientId=${patientId}`);

        if (insuranceResponse.ok) {
          const insuranceData = await insuranceResponse.json();
          setInsuranceData(insuranceData);
        } else {
          throw new Error('Failed to fetch insurance data');
        }
      }
    } catch (err) {
      setError(`An error occurred: ${err.message}`);
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  }, [isStaff, isPatient, user.id, selectedPatientId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchData();

    // Log access for HIPAA compliance
    logHipaaAccess('view');

    // Memoize WebSocket event handlers
    const handleInvoiceUpdate = useCallback((updatedInvoice) => {
      setInvoices(prevInvoices => {
        const exists = prevInvoices.some(invoice => invoice._id === updatedInvoice._id);
        if (exists) {
          return prevInvoices.map(invoice => 
            invoice._id === updatedInvoice._id ? updatedInvoice : invoice
          );
        } else {
          return [...prevInvoices, updatedInvoice];
        }
      });
    }, []);

    const handleNewInvoice = useCallback((newInvoice) => {
      setInvoices(prevInvoices => [...prevInvoices, newInvoice]);
    }, []);

    socket.on('invoice:update', handleInvoiceUpdate);
    socket.on('invoice:new', handleNewInvoice);
    socket.on('payment:update', handlePaymentUpdate);
    socket.on('payment-method:update', handlePaymentMethodUpdate);
    socket.on('payment-method:delete', handlePaymentMethodDelete);
    socket.on('insurance:update', handleInsuranceUpdate);
    socket.on('insurance:new', handleNewInsurance);
    socket.on('insurance:delete', handleInsuranceDelete);

    return () => {
      socket.off('invoice:update', handleInvoiceUpdate);
      socket.off('invoice:new', handleNewInvoice);
      socket.off('payment:update', handlePaymentUpdate);
      socket.off('payment-method:update', handlePaymentMethodUpdate);
      socket.off('payment-method:delete', handlePaymentMethodDelete);
      socket.off('insurance:update', handleInsuranceUpdate);
      socket.off('insurance:new', handleNewInsurance);
      socket.off('insurance:delete', handleInsuranceDelete);
    };
  }, [isAuthenticated, fetchData]);

  const handlePaymentMethodUpdate = (updatedMethod) => {
    setPaymentMethods(prevMethods => {
      const exists = prevMethods.some(method => method._id === updatedMethod._id);
      if (exists) {
        return prevMethods.map(method => 
          method._id === updatedMethod._id ? updatedMethod : method
        );
      } else {
        return [...prevMethods, updatedMethod];
      }
    });
  };

  const handlePaymentMethodDelete = (deletedId) => {
    setPaymentMethods(prevMethods => 
      prevMethods.filter(method => method._id !== deletedId)
    );
  };

  const handleAddPaymentMethod = async (paymentData) => {
    try {
      setLoading(true);
      validatePaymentMethod(paymentData);
      const patientId = isPatient ? user.id : selectedPatientId;
      
      const response = await fetchWithSecurityHeaders('/api/billing/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...paymentData,
          patientId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }

      const newPaymentMethod = await response.json();
      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      setShowPaymentMethodModal(false);
      
      // Log modification for HIPAA compliance
      logHipaaAccess('modify', 'payment-method');
      
      // Socket will broadcast this update
      socket.emit('payment-method:update', newPaymentMethod);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPaymentMethod = async (paymentData) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/billing/payment-methods/${paymentData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error('Failed to update payment method');
      }

      const updatedPaymentMethod = await response.json();
      setPaymentMethods(prev => 
        prev.map(method => 
          method._id === updatedPaymentMethod._id ? updatedPaymentMethod : method
        )
      );
      setEditingPaymentMethod(null);
      setShowPaymentMethodModal(false);
      
      // Socket will broadcast this update
      socket.emit('payment-method:update', updatedPaymentMethod);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/billing/payment-methods/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      setPaymentMethods(prev => prev.filter(method => method._id !== id));
      setConfirmDeleteId(null);
      
      // Socket will broadcast this deletion
      socket.emit('payment-method:delete', id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (id) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/billing/payment-methods/${id}/set-default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      // Update all payment methods to reflect the new default
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method._id === id
        }))
      );
      
      // Socket will broadcast this update
      socket.emit('payment-method:default-updated', {
        patientId: isPatient ? user.id : selectedPatientId,
        defaultPaymentMethodId: id
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddPaymentMethodModal = () => {
    setEditingPaymentMethod(null);
    setShowPaymentMethodModal(true);
  };

  const openEditPaymentMethodModal = (method) => {
    setEditingPaymentMethod(method);
    setShowPaymentMethodModal(true);
  };

  const handleInsuranceUpdate = (updatedInsurance) => {
    setInsuranceData(prevData => {
      const exists = prevData.some(data => data._id === updatedInsurance._id);
      if (exists) {
        return prevData.map(data => 
          data._id === updatedInsurance._id ? updatedInsurance : data
        );
      } else {
        return [...prevData, updatedInsurance];
      }
    });
  };

  const handleNewInsurance = (newInsurance) => {
    setInsuranceData(prevData => [...prevData, newInsurance]);
  };

  const handleInsuranceDelete = (deletedId) => {
    setInsuranceData(prevData => 
      prevData.filter(data => data._id !== deletedId)
    );
  };

  const openAddInsuranceModal = () => {
    setEditingInsurance(null);
    setShowInsuranceModal(true);
  };

  const openEditInsuranceModal = (insurance) => {
    setEditingInsurance(insurance);
    setShowInsuranceModal(true);
  };

  const handleAddInsurance = async (insuranceData) => {
    try {
      setLoading(true);
      const patientId = isPatient ? user.id : selectedPatientId;
      
      const response = await fetch('/api/insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...insuranceData,
          patientId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add insurance');
      }

      const newInsurance = await response.json();
      setInsuranceData(prev => [...prev, newInsurance]);
      setShowInsuranceModal(false);
      
      // Socket will broadcast this update
      socket.emit('insurance:new', newInsurance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <InvoiceFilter
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <InvoiceList invoices={invoices} />
      {(isPatient || (isStaff && selectedPatientId)) && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Payment Methods
            </h2>
            {(isPatient || isAdmin) && (
              <button
                onClick={openAddPaymentMethodModal}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Add Payment Method"
                role="button"
              >
                <FiPlus className="mr-1.5 h-4 w-4" />
                Add Payment Method
              </button>
            )}
          </div>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-6">
              <FiCreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isPatient ? 
                  'Add a payment method to easily pay your invoices.' : 
                  'This patient has no payment methods on file.'}
              </p>
              {isPatient && (
                <div className="mt-6">
                  <button
                    onClick={openAddPaymentMethodModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiPlus className="mr-1.5 h-4 w-4" />
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map(method => (
                <div key={method._id} className="border border-gray-200 rounded-lg p-4 relative">
                  {method.isDefault && (
                    <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Default
                    </span>
                  )}
                  <div className="flex items-center mb-2">
                    <FiCreditCard className="mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {method.cardType} •••• {method.lastFour}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Expires: {method.expiryMonth}/{method.expiryYear}
                  </p>
                  <p className="text-sm text-gray-500">
                    {method.billingName}
                  </p>
                  <div className="mt-4 flex justify-end space-x-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefaultPaymentMethod(method._id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                        aria-label="Set as Default"
                        role="button"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => openEditPaymentMethodModal(method)}
                      className="text-xs text-gray-600 hover:text-gray-800"
                      aria-label="Edit Payment Method"
                      role="button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(method._id)}
                      className="text-xs text-red-600 hover:text-red-800"
                      aria-label="Delete Payment Method"
                      role="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {(isPatient || (isStaff && selectedPatientId)) && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Insurance Information
            </h2>
            {(isPatient || isAdmin) && (
              <button
                onClick={openAddInsuranceModal}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="mr-1.5 h-4 w-4" />
                Add Insurance
              </button>
            )}
          </div>
          {insuranceData.length === 0 ? (
            <div className="text-center py-6">
              <FiCreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No insurance information</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isPatient ? 
                  'Add your insurance information to facilitate billing.' : 
                  'This patient has no insurance information on file.'}
              </p>
              {isPatient && (
                <div className="mt-6">
                  <button
                    onClick={openAddInsuranceModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiPlus className="mr-1.5 h-4 w-4" />
                    Add Insurance
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <InsuranceModal
                show={showInsuranceModal}
                onClose={() => setShowInsuranceModal(false)}
                onSubmit={handleAddInsurance}
                editingInsurance={editingInsurance}
                loading={loading}
              />
            </Suspense>
          )}
        </div>
      )}
      {showPaymentMethodModal && (
        <Suspense fallback={<LoadingSpinner />}>
          <PaymentMethodForm
            editingPaymentMethod={editingPaymentMethod}
            onSubmit={editingPaymentMethod ? handleEditPaymentMethod : handleAddPaymentMethod}
            onCancel={() => setShowPaymentMethodModal(false)}
            loading={loading}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Billing; 