import React from 'react';
import { render, screen } from '@testing-library/react';
import Billing from '../pages/Billing';

describe('Billing Component', () => {
  it('renders the Billing page', () => {
    render(<Billing />);
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the Billing page.')).toBeInTheDocument();
  });
}); 