import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import InsuranceModal from '../InsuranceModal';

const mockInsurance = {
  provider: 'Health Insurance Co',
  policyNumber: '123456789',
  coverageType: 'Full',
  expiryDate: '2025-12-31'
};

describe('InsuranceModal Component', () => {
  test('renders without crashing', () => {
    render(<InsuranceModal show={true} editingInsurance={mockInsurance} />);
    expect(screen.getByText('Insurance Information')).toBeInTheDocument();
  });

  test('displays insurance details correctly', () => {
    render(<InsuranceModal show={true} editingInsurance={mockInsurance} />);
    expect(screen.getByDisplayValue('Health Insurance Co')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
  });

  test('handles form submission', () => {
    const handleSubmit = jest.fn();
    render(<InsuranceModal show={true} editingInsurance={mockInsurance} onSubmit={handleSubmit} />);
    fireEvent.click(screen.getByText('Save'));
    expect(handleSubmit).toHaveBeenCalled();
  });
});

// Test to check if InsuranceModal renders correctly when not visible
it('does not render when show is false', () => {
  render(<InsuranceModal show={false} />);
  expect(screen.queryByText(/add insurance/i)).not.toBeInTheDocument();
});

// Test to check if InsuranceModal renders correctly when visible
it('renders correctly when show is true', () => {
  render(<InsuranceModal show={true} onClose={() => {}} onSubmit={() => {}} />);
  expect(screen.getByText(/add insurance/i)).toBeInTheDocument();
});

// Test to check if InsuranceModal calls onClose when cancel button is clicked
it('calls onClose when cancel button is clicked', () => {
  const onClose = jest.fn();
  render(<InsuranceModal show={true} onClose={onClose} onSubmit={() => {}} />);
  fireEvent.click(screen.getByText(/cancel/i));
  expect(onClose).toHaveBeenCalled();
}); 