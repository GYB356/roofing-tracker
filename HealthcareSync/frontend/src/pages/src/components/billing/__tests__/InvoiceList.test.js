import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import InvoiceList from '../InvoiceList';

const mockInvoices = [
  { _id: '1', amount: 100, status: 'paid', date: '2023-01-01' },
  { _id: '2', amount: 200, status: 'unpaid', date: '2023-02-01' }
];

describe('InvoiceList Component', () => {
  test('renders without crashing', () => {
    render(<InvoiceList invoices={mockInvoices} />);
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  test('displays the correct number of invoices', () => {
    render(<InvoiceList invoices={mockInvoices} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(mockInvoices.length);
  });

  test('displays invoice details correctly', () => {
    render(<InvoiceList invoices={mockInvoices} />);
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });
});

// Test to check if InvoiceList renders correctly with no invoices
it('renders no invoices message when invoice list is empty', () => {
  render(<InvoiceList invoices={[]} />);
  expect(screen.getByText(/no invoices available/i)).toBeInTheDocument();
});

// Test to check if InvoiceList renders invoices correctly
it('renders invoices correctly', () => {
  const invoices = [
    { _id: '1', number: 'INV-001', amount: 100, dueDate: '2023-12-31' },
    { _id: '2', number: 'INV-002', amount: 200, dueDate: '2024-01-15' }
  ];
  render(<InvoiceList invoices={invoices} />);
  expect(screen.getByText(/inv-001/i)).toBeInTheDocument();
  expect(screen.getByText(/inv-002/i)).toBeInTheDocument();
}); 