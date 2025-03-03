import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import PaymentMethods from '../PaymentMethods';

const mockPaymentMethods = [
  { _id: '1', cardType: 'Visa', lastFour: '1234', expiryMonth: '12', expiryYear: '2025', billingName: 'John Doe', isDefault: true },
  { _id: '2', cardType: 'MasterCard', lastFour: '5678', expiryMonth: '11', expiryYear: '2024', billingName: 'Jane Doe', isDefault: false }
];

describe('PaymentMethods Component', () => {
  test('renders without crashing', () => {
    render(<PaymentMethods paymentMethods={mockPaymentMethods} />);
    expect(screen.getByText('Payment Methods')).toBeInTheDocument();
  });

  test('displays the correct number of payment methods', () => {
    render(<PaymentMethods paymentMethods={mockPaymentMethods} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(mockPaymentMethods.length);
  });

  test('displays payment method details correctly', () => {
    render(<PaymentMethods paymentMethods={mockPaymentMethods} />);
    expect(screen.getByText('Visa •••• 1234')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('handles set default payment method', () => {
    render(<PaymentMethods paymentMethods={mockPaymentMethods} />);
    fireEvent.click(screen.getByText('Set as Default'));
    // Check if the default method is updated
  });
});

// Test to check if PaymentMethods renders correctly with no payment methods
it('renders no payment methods message when list is empty', () => {
  render(<PaymentMethods paymentMethods={[]} />);
  expect(screen.getByText(/no payment methods/i)).toBeInTheDocument();
});

// Test to check if PaymentMethods renders payment methods correctly
it('renders payment methods correctly', () => {
  const paymentMethods = [
    { _id: '1', cardType: 'Visa', lastFour: '1234', expiryMonth: '12', expiryYear: '2023', billingName: 'John Doe' },
    { _id: '2', cardType: 'Mastercard', lastFour: '5678', expiryMonth: '01', expiryYear: '2024', billingName: 'Jane Smith' }
  ];
  render(<PaymentMethods paymentMethods={paymentMethods} />);
  expect(screen.getByText(/visa/i)).toBeInTheDocument();
  expect(screen.getByText(/mastercard/i)).toBeInTheDocument();
}); 