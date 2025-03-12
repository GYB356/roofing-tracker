import { Invoice } from '../models/billing.js';
import { format } from 'date-fns';

/**
 * Generate a unique invoice number
 */
export const generateInvoiceNumber = async () => {
  const datePrefix = format(new Date(), 'yyyyMM');
  const latestInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^INV-${datePrefix}` }
  }).sort({ invoiceNumber: -1 });

  let sequenceNumber = 1;
  if (latestInvoice) {
    const lastSequence = latestInvoice.invoiceNumber.split('-')[2];
    sequenceNumber = parseInt(lastSequence, 10) + 1;
  }
  const sequenceFormatted = sequenceNumber.toString().padStart(4, '0');
  return `INV-${datePrefix}-${sequenceFormatted}`;
};

/**
 * Calculate tax for invoice items
 */
export const calculateInvoiceTotals = (items, taxRate = 0) => {
  let subtotal = 0;
  let tax = 0;
  items.forEach(item => {
    const itemAmount = item.quantity * item.unitPrice;
    subtotal += itemAmount;
    const itemTaxRate = item.taxRate !== undefined ? item.taxRate : taxRate;
    const itemTax = item.taxable ? (itemAmount * (itemTaxRate / 100)) : 0;
    tax += itemTax;
  });
  return {
    subtotal,
    tax,
    total: subtotal + tax
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currencyCode 
  }).format(amount);
};

/**
 * Generate PDF invoice
 */
export const generateInvoicePDF = async (invoice) => {
  return Buffer.from('PDF generation not implemented');
};

/**
 * Check if an invoice is overdue
 */
export const isInvoiceOverdue = (invoice) => {
  if (invoice.status === 'Paid' || invoice.status === 'Cancelled') {
    return false;
  }
  return new Date(invoice.dueDate) < new Date();
};

/**
 * Update invoice statuses
 */
export const updateInvoiceStatuses = async () => {
  const currentDate = new Date();
  const overdueInvoices = await Invoice.find({
    status: { $in: ['Issued', 'Partially Paid'] },
    dueDate: { $lt: currentDate }
  });
  for (const invoice of overdueInvoices) {
    invoice.status = 'Overdue';
    await invoice.save();
  }
  return {
    processed: overdueInvoices.length,
    updatedToOverdue: overdueInvoices.length
  };
};

/**
 * Calculate insurance coverage estimate
 */
export const calculateInsuranceCoverage = (items, insuranceInfo) => {
  let totalAmount = 0;
  let estimatedCoverage = 0;
  items.forEach(item => {
    totalAmount += item.quantity * item.unitPrice;
  });
  if (insuranceInfo && insuranceInfo.coveragePercentage) {
    estimatedCoverage = totalAmount * (insuranceInfo.coveragePercentage / 100);
  }
  return {
    totalAmount,
    estimatedCoverage,
    patientResponsibility: totalAmount - estimatedCoverage
  };
};
