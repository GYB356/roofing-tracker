import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import DeviceIntegration from '../../pages/DeviceIntegration';

const renderWithAuth = (ui, { providerProps, ...renderOptions }) => {
    return render(
        <AuthContext.Provider {...providerProps}>{ui}</AuthContext.Provider>,
        renderOptions
    );
};

describe('DeviceIntegration Component', () => {
    test('renders DeviceIntegration component for authorized users', () => {
        const providerProps = {
            value: { user: { role: 'doctor' } },
        };
        renderWithAuth(<DeviceIntegration />, { providerProps });

        expect(screen.getByText(/Device Integration/i)).toBeInTheDocument();
        expect(screen.getByText(/Monitor medical device data/i)).toBeInTheDocument();
    });

    test('denies access for unauthorized users', () => {
        const providerProps = {
            value: { user: { role: 'guest' } },
        };
        renderWithAuth(<DeviceIntegration />, { providerProps });

        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });
}); 