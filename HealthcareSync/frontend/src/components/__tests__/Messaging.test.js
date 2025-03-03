import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import Messaging from '../../pages/Messaging';

const renderWithAuth = (ui, { providerProps, ...renderOptions }) => {
    return render(
        <AuthContext.Provider {...providerProps}>{ui}</AuthContext.Provider>,
        renderOptions
    );
};

describe('Messaging Component', () => {
    test('renders Messaging component for authorized users', () => {
        const providerProps = {
            value: { user: { role: 'patient' } },
        };
        renderWithAuth(<Messaging />, { providerProps });

        expect(screen.getByText(/Messaging/i)).toBeInTheDocument();
        expect(screen.getByText(/Secure communication with healthcare providers/i)).toBeInTheDocument();
    });

    test('denies access for unauthorized users', () => {
        const providerProps = {
            value: { user: null },
        };
        renderWithAuth(<Messaging />, { providerProps });

        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });

    test('allows access for authenticated users', () => {
        const roles = ['patient', 'doctor', 'nurse', 'admin'];
        roles.forEach(role => {
            const providerProps = {
                value: { user: { role } },
            };
            const { unmount } = renderWithAuth(<Messaging />, { providerProps });
            expect(screen.getByText(/Messaging/i)).toBeInTheDocument();
            unmount();
        });
    });
}); 