import api from './api';
import { Invoice, PaymentMethod } from '../models/invoiceModel.js';
import Patient from '../models/patient.js';
import { CustomError } from '../utils/error-handler.js';

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
  },

  /**
   * Update payment method details
   */
  async updatePaymentMethodDetails(paymentMethodId, updateData) {
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      throw new CustomError('Payment method not found', 404);
    }
    Object.keys(updateData).forEach(key => {
      paymentMethod[key] = updateData[key];
    });
    await paymentMethod.save();
    return paymentMethod;
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(patientId, paymentMethodId) {
    await PaymentMethod.updateMany(
      { patientId },
      { $set: { isDefault: false } }
    );
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      throw new CustomError('Payment method not found', 404);
    }
    if (paymentMethod.patientId.toString() !== patientId) {
      throw new CustomError('Payment method does not belong to this patient', 403);
    }
    paymentMethod.isDefault = true;
    await paymentMethod.save();
    return paymentMethod;
  },

  /**
   * Get payment history for a patient
   */
  async getPaymentHistoryForPatient(patientId, filters = {}) {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new CustomError('Patient not found', 404);
    }
    const invoices = await Invoice.find({
      patientId,
      'payments.0': { $exists: true }
    });
    const payments = [];
    invoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        payments.push({
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          ...payment.toObject(),
          invoiceDate: invoice.issueDate
        });
      });
    });
    payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    return payments;
  },

  /**
   * Process refund for an invoice
   */
  async processRefund(invoiceId, refundData) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new CustomError('Invoice not found', 404);
    }
    if (refundData.amount <= 0) {
      throw new CustomError('Refund amount must be greater than zero', 400);
    }
    if (refundData.amount > invoice.amountPaid) {
      throw new CustomError('Refund amount cannot exceed the amount paid', 400);
    }
    invoice.status = 'Refunded';
    invoice.amountPaid -= refundData.amount;
    invoice.balance = invoice.total - invoice.amountPaid;
    invoice.refunds = invoice.refunds || [];
    invoice.refunds.push({
      refundDate: new Date(),
      amount: refundData.amount,
      reason: refundData.reason,
      processedBy: refundData.processedBy,
      refundReference: refundData.refundReference
    });
    await invoice.save();
    return invoice;
  }
};

export default billingService;