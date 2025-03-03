import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Telemedicine from './Telemedicine';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  }));
});

// Test suite for Telemedicine component
describe('Telemedicine Component', () => {
  test('renders Telemedicine component', () => {
    render(<Telemedicine />);
    const heading = screen.getByRole('heading', { name: /Telemedicine Consultations/i });
    expect(heading).toBeInTheDocument();
  });

  test('displays loading spinner when loading', () => {
    render(<Telemedicine />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  test('displays error message when there is an error', () => {
    render(<Telemedicine />);
    const errorMessage = screen.queryByText(/User not authenticated/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('allows tab navigation between upcoming and past consultations', () => {
    render(<Telemedicine />);
    const upcomingTab = screen.getByRole('button', { name: /Upcoming/i });
    const pastTab = screen.getByRole('button', { name: /Past/i });
    fireEvent.click(pastTab);
    expect(pastTab).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(upcomingTab);
    expect(upcomingTab).toHaveAttribute('aria-selected', 'true');
  });
}); 