import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Issued', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled', 'Refunded'],
    default: 'Draft'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    min: 0
  },
  items: [{
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    taxable: {
      type: Boolean,
      default: true
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    cptCode: String,
    serviceDate: Date
  }],
  payments: [{
    paymentDate: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'Debit Card', 'Cash', 'Check', 'Insurance', 'Bank Transfer', 'Other'],
      required: true
    },
    paymentReference: String,
    notes: String
  }],
  insuranceDetails: {
    primaryInsurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      claimNumber: String,
      claimStatus: {
        type: String,
        enum: ['Not Submitted', 'Submitted', 'In Review', 'Approved', 'Partially Approved', 'Denied', 'Appealed']
      },
      submissionDate: Date,
      approvalDate: Date,
      approvedAmount: Number,
      denialReason: String
    },
    secondaryInsurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      claimNumber: String,
      claimStatus: {
        type: String,
        enum: ['Not Submitted', 'Submitted', 'In Review', 'Approved', 'Partially Approved', 'Denied', 'Appealed']
      },
      submissionDate: Date,
      approvalDate: Date,
      approvedAmount: Number,
      denialReason: String
    }
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for frequently queried fields
InvoiceSchema.index({ patientId: 1 });
InvoiceSchema.index({ appointmentId: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });

// Pre-save hook to calculate balance
InvoiceSchema.pre('save', function(next) {
  this.balance = this.total - this.amountPaid;
  
  if (this.amountPaid >= this.total) {
    this.status = 'Paid';
  } else if (this.amountPaid > 0) {
    this.status = 'Partially Paid';
  } else if (this.status === 'Issued' && this.dueDate < new Date()) {
    this.status = 'Overdue';
  }
  
  next();
});

// Method to add payment
InvoiceSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  this.amountPaid += paymentData.amount;
  return this.save();
};

const Invoice = mongoose.model('Invoice', InvoiceSchema);

// Payment Method Schema for storing patient payment methods securely
const PaymentMethodSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  type: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'Bank Account', 'Other'],
    required: true
  },
  cardholderName: String,
  cardBrand: String,
  last4: String,
  expiryMonth: Number,
  expiryYear: Number,
  bankName: String,
  accountLast4: String,
  routingNumber: String,
  paymentProcessorId: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

PaymentMethodSchema.index({ patientId: 1 });

const PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema);

export { Invoice, PaymentMethod };
