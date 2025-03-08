import React, { createContext, useContext, useState, useEffect } from 'react';
import billingService from '../services/billingService';
import { useAuth } from './AuthContext';

const BillingContext = createContext();

export function BillingProvider({ children }) {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshInvoices = async () => {
    try {
      const data = await billingService.getInvoices(currentUser.id);
      setInvoices(data);
    } catch (err) {
      setError('Failed to load invoices');
    }
  };

  const handlePayment = async (paymentData) => {
    try {
      const result = await billingService.processPayment(paymentData);
      await refreshInvoices();
      return result;
    } catch (err) {
      setError('Payment processing failed');
      throw err;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await refreshInvoices();
        const methods = await billingService.getPaymentHistory(currentUser.id);
        setPaymentMethods(methods);
      } catch (err) {
        setError('Failed to initialize billing data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) loadInitialData();
  }, [currentUser]);

  return (
    <BillingContext.Provider
      value={{
        invoices,
        paymentMethods,
        loading,
        error,
        handlePayment,
        refreshInvoices
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  return useContext(BillingContext);
}