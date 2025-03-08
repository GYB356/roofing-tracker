import api from './api';

const billingService = {
  // Get invoices for current user
  getInvoices: async (userId) => {
    try {
      const response = await api.get(`/billing/invoices/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch invoices');
    }
  },

  // Process payment
  processPayment: async (paymentData) => {
    try {
      const response = await api.post('/billing/payments', paymentData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to process payment');
    }
  },

  // Update payment method
  updatePaymentMethod: async (methodData) => {
    try {
      const response = await api.put('/billing/payment-methods', methodData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update payment method');
    }
  },

  // Get payment history
  getPaymentHistory: async (userId) => {
    try {
      const response = await api.get(`/billing/payments/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to retrieve payment history');
    }
  }
};

export default billingService;