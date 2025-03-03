import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import StaffScheduling from '../StaffScheduling';
import { AuthContext } from '../../contexts/AuthContext';

const mockUser = { id: '1', role: 'admin' };

const renderWithAuthContext = (component) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true }}>
      {component}
    </AuthContext.Provider>
  );
};

describe('StaffScheduling Component', () => {
  test('renders without crashing', () => {
    renderWithAuthContext(<StaffScheduling />);
    expect(screen.getByText('Staff Scheduling')).toBeInTheDocument();
  });

  test('displays loading spinner initially', () => {
    renderWithAuthContext(<StaffScheduling />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays schedules when loaded', async () => {
    renderWithAuthContext(<StaffScheduling />);
    // Mock fetch and socket data here
    // Check if schedules are displayed
  });

  test('handles add schedule', async () => {
    renderWithAuthContext(<StaffScheduling />);
    fireEvent.click(screen.getByLabelText('Add Schedule'));
    // Check if modal opens and form is displayed
  });

  test('handles edit schedule', async () => {
    renderWithAuthContext(<StaffScheduling />);
    // Mock schedule data
    fireEvent.click(screen.getByLabelText('Edit Schedule'));
    // Check if edit form is displayed
  });

  test('handles delete schedule', async () => {
    renderWithAuthContext(<StaffScheduling />);
    // Mock schedule data
    fireEvent.click(screen.getByLabelText('Delete Schedule'));
    // Check if schedule is removed
  });
}); 