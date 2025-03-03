import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import MedicalRecords from '../../pages/MedicalRecords';

const renderWithAuth = (ui, { providerProps, ...renderOptions }) => {
    return render(
        <AuthContext.Provider {...providerProps}>{ui}</AuthContext.Provider>,
        renderOptions
    );
};

describe('MedicalRecords Component', () => {
    test('renders MedicalRecords component for authorized users', () => {
        const providerProps = {
            value: { user: { role: 'doctor' } },
        };
        renderWithAuth(<MedicalRecords />, { providerProps });

        expect(screen.getByText(/Medical Records/i)).toBeInTheDocument();
        expect(screen.getByText(/Access and manage patient medical records/i)).toBeInTheDocument();
    });

    test('denies access for unauthorized users', () => {
        const providerProps = {
            value: { user: { role: 'guest' } },
        };
        renderWithAuth(<MedicalRecords />, { providerProps });

        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });

    test('allows access for different authorized roles', () => {
        const roles = ['patient', 'doctor', 'nurse', 'admin'];
        roles.forEach(role => {
            const providerProps = {
                value: { user: { role } },
            };
            const { unmount } = renderWithAuth(<MedicalRecords />, { providerProps });
            expect(screen.getByText(/Medical Records/i)).toBeInTheDocument();
            unmount();
        });
    });
}); 