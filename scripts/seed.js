// scripts/seed.js
console.log('Seeding database...');

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

// Import User model
let User;
try {
  User = (await import('../src/models/User.js')).default;
  console.log('Loaded User model from src/models/User.js');
} catch (error) {
  console.error('Failed to import User model:', error);
  process.exit(1);
}

// Try to import or create Invoice and PaymentMethod models
let Invoice, PaymentMethod;
try {
  const billingModule = await import('../src/models/billing.js');
  Invoice = billingModule.Invoice;
  PaymentMethod = billingModule.PaymentMethod;
  console.log('Loaded billing models from src/models/billing.js');
} catch (error) {
  console.log('Billing models not found, creating them now...');
  
  // Create Invoice schema
  const InvoiceSchema = new mongoose.Schema({
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
      }
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
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Create PaymentMethod schema
  const PaymentMethodSchema = new mongoose.Schema({
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Create models
  Invoice = mongoose.model('Invoice', InvoiceSchema);
  PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema);
}

try {
  console.log('Connecting to MongoDB...');
  await mongoose.connect('mongodb://localhost:27017/healthcare-sync');
  
  console.log('Connected to MongoDB');
  
  // Clear existing data
  await User.deleteMany({});
  if (Invoice) await Invoice.deleteMany({});
  if (PaymentMethod) await PaymentMethod.deleteMany({});
  console.log('Cleared existing data');
  
  // Create admin user
  const adminUser = new User({
    email: 'admin@example.com',
    password: await bcrypt.hash('Password123!', 10),
    fullName: 'Admin User',
    role: 'ADMIN',
    isVerified: true
  });
  
  await adminUser.save();
  console.log('Admin user created:', adminUser.email);
  
  // Create a doctor user
  const doctorUser = new User({
    email: 'doctor@example.com',
    password: await bcrypt.hash('Password123!', 10),
    fullName: 'Dr. Smith',
    role: 'DOCTOR',
    isVerified: true
  });
  
  await doctorUser.save();
  console.log('Doctor user created:', doctorUser.email);
  
  // Create patient users
  const patients = [];
  for (let i = 1; i <= 5; i++) {
    const patientUser = new User({
      email: `patient${i}@example.com`,
      password: await bcrypt.hash('Password123!', 10),
      fullName: faker.person.fullName(),
      role: 'PATIENT',
      isVerified: true
    });
    
    await patientUser.save();
    patients.push(patientUser);
    console.log(`Patient user created: ${patientUser.email}`);
  }
  
  // Create invoices
  if (Invoice) {
    for (let i = 1; i <= 10; i++) {
      const patient = faker.helpers.arrayElement(patients);
      
      // Create invoice items
      const items = [];
      const itemCount = faker.number.int({ min: 1, max: 3 });
      let subtotal = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const quantity = faker.number.int({ min: 1, max: 3 });
        const unitPrice = faker.number.float({ min: 50, max: 300, precision: 0.01 });
        const amount = quantity * unitPrice;
        
        items.push({
          description: faker.helpers.arrayElement([
            'Office Visit', 'Consultation', 'Lab Test', 'Procedure', 'Vaccination'
          ]),
          quantity,
          unitPrice,
          amount
        });
        
        subtotal += amount;
      }
      
      // Calculate tax and total
      const tax = subtotal * 0.07; // 7% tax
      const total = subtotal + tax;
      
      // Determine status and amount paid
      const statusOptions = ['Draft', 'Issued', 'Paid', 'Partially Paid', 'Overdue'];
      const status = faker.helpers.arrayElement(statusOptions);
      let amountPaid = 0;
      const payments = [];
      
      if (status === 'Paid') {
        amountPaid = total;
        payments.push({
          paymentDate: new Date(),
          amount: total,
          paymentMethod: faker.helpers.arrayElement(['Credit Card', 'Debit Card', 'Check']),
          paymentReference: faker.finance.accountNumber(8)
        });
      } else if (status === 'Partially Paid') {
        amountPaid = faker.number.float({ min: 1, max: total - 0.01, precision: 0.01 });
        payments.push({
          paymentDate: new Date(),
          amount: amountPaid,
          paymentMethod: faker.helpers.arrayElement(['Credit Card', 'Debit Card', 'Check']),
          paymentReference: faker.finance.accountNumber(8)
        });
      }
      
      const balance = total - amountPaid;
      
      // Create the invoice
      const invoice = new Invoice({
        patientId: patient._id,
        invoiceNumber: `INV-${new Date().getFullYear()}-${i.toString().padStart(4, '0')}`,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status,
        subtotal,
        tax,
        total,
        amountPaid,
        balance,
        items,
        payments
      });
      
      await invoice.save();
      console.log(`Invoice created: ${invoice.invoiceNumber}`);
    }
  }
  
  // Create payment methods
  if (PaymentMethod) {
    for (const patient of patients) {
      // Credit card
      const creditCard = new PaymentMethod({
        patientId: patient._id,
        type: 'Credit Card',
        cardholderName: patient.fullName,
        cardBrand: faker.helpers.arrayElement(['Visa', 'Mastercard', 'Amex']),
        last4: faker.finance.creditCardNumber('####'),
        expiryMonth: faker.number.int({ min: 1, max: 12 }),
        expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 5 }),
        isDefault: true
      });
      
      await creditCard.save();
      console.log(`Payment method created for ${patient.email}: ${creditCard.type}`);
      
      // Bank account (for some patients)
      if (faker.datatype.boolean()) {
        const bankAccount = new PaymentMethod({
          patientId: patient._id,
          type: 'Bank Account',
          cardholderName: patient.fullName,
          last4: faker.finance.accountNumber('####'),
          isDefault: false
        });
        
        await bankAccount.save();
        console.log(`Payment method created for ${patient.email}: ${bankAccount.type}`);
      }
    }
  }
  
  console.log('Database seeding completed successfully!');
  
  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  
} catch (error) {
  console.error('Error seeding database:', error);
}

console.log('Seeding completed.');