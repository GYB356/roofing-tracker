import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import Appointments from '../../pages/Appointments';

const renderWithAuth = (ui, { providerProps, ...renderOptions }) => {
    return render(
        <AuthContext.Provider {...providerProps}>{ui}</AuthContext.Provider>,
        renderOptions
    );
};

describe('Appointments Component', () => {
    test('renders Appointments component for authorized users', () => {
        const providerProps = {
            value: { user: { role: 'patient' } },
        };
        renderWithAuth(<Appointments />, { providerProps });

        expect(screen.getByText(/Appointments/i)).toBeInTheDocument();
        expect(screen.getByText(/Manage your appointments/i)).toBeInTheDocument();
    });

    test('denies access for unauthorized users', () => {
        const providerProps = {
            value: { user: null },
        };
        renderWithAuth(<Appointments />, { providerProps });

        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });
}); 