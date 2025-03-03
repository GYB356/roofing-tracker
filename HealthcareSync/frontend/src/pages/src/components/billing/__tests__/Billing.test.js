import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Billing from '../Billing';
import { AuthContext } from '../../contexts/AuthContext';

const mockUser = { id: '1', role: 'patient' };

const renderWithAuthContext = (component) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
      {component}
    </AuthContext.Provider>
  );
};

describe('Billing Component', () => {
  test('renders without crashing', () => {
    renderWithAuthContext(<Billing />);
    expect(screen.getByText('Payment Methods')).toBeInTheDocument();
  });

  test('displays loading spinner initially', () => {
    renderWithAuthContext(<Billing />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays payment methods when loaded', async () => {
    renderWithAuthContext(<Billing />);
    // Mock fetch and socket data here
    // Check if payment methods are displayed
  });

  test('handles add payment method', async () => {
    renderWithAuthContext(<Billing />);
    fireEvent.click(screen.getByLabelText('Add Payment Method'));
    // Check if modal opens and form is displayed
  });
});
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Billing from '../Billing';
import { AuthContext } from '../../contexts/AuthContext';

const mockUser = { id: '1', role: 'patient' };

const renderWithAuthContext = (component) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
      {component}
    </AuthContext.Provider>
  );
};

describe('Billing Component', () => {
  test('renders without crashing', () => {
    renderWithAuthContext(<Billing />);
    expect(screen.getByText('Payment Methods')).toBeInTheDocument();
  });

  test('displays loading spinner initially', () => {
    renderWithAuthContext(<Billing />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays payment methods when loaded', async () => {
    renderWithAuthContext(<Billing />);
    // Mock fetch and socket data here
    // Check if payment methods are displayed
  });

  test('handles add payment method', async () => {
    renderWithAuthContext(<Billing />);
    fireEvent.click(screen.getByLabelText('Add Payment Method'));
    // Check if modal opens and form is displayed
  });
});