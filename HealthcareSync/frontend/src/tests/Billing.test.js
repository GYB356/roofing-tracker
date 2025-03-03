import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Billing from '../lib/Billing';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

// Mock the child components
jest.mock('../components/billing/InvoiceList', () => {
    return function MockInvoiceList({ onViewInvoice, onPayInvoice, onDeleteInvoice }) {
        return (
            <div data-testid="invoice-list">
                <button data-testid="view-invoice-btn" onClick={() => onViewInvoice({ id: '1', invoiceNumber: 'INV-001' })}>
                    View Invoice
                </button>
                <button data-testid="pay-invoice-btn" onClick={() => onPayInvoice({ id: '1', invoiceNumber: 'INV-001' })}>
                    Pay Invoice
                </button>
                <button data-testid="delete-invoice-btn" onClick={() => onDeleteInvoice('1')}>
                    Delete Invoice
                </button>
            </div>
        );
    };
});

jest.mock('../components/billing/PaymentMethods', () => {
    return function MockPaymentMethods({ onAddPaymentMethod, onEditPaymentMethod, onDeletePaymentMethod, onSelectPaymentMethod }) {
        return (
            <div data-testid="payment-methods">
                <button data-testid="add-payment-btn" onClick={() => onAddPaymentMethod({ id: '1', type: 'credit_card' })}>
                    Add Payment Method
                </button>
                <button data-testid="edit-payment-btn" onClick={() => onEditPaymentMethod({ id: '1', type: 'credit_card' })}>
                    Edit Payment Method
                </button>
                <button data-testid="delete-payment-btn" onClick={() => onDeletePaymentMethod('1')}>
                    Delete Payment Method
                </button>
                <button data-testid="select-payment-btn" onClick={() => onSelectPaymentMethod({ id: '1', type: 'credit_card' })}>
                    Select Payment Method
                </button>
            </div>
        );
    };
});

jest.mock('../components/billing/InsuranceModal', () => {
    return function MockInsuranceModal({ isOpen, onClose, onSave }) {
        if (!isOpen) return null;
        return (
            <div data-testid="insurance-modal">
                <button data-testid="save-insurance-btn" onClick={() => onSave({ id: '1', provider: 'Test Insurance' })}>
                    Save Insurance
                </button>
                <button data-testid="close-insurance-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    };
});

// Mock fetch API
global.fetch = jest.fn();

// Mock socket
const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
};

// Mock auth context
const mockAuthContext = {
    user: {
        id: 'user1',
        name: 'Test User',
        role: 'admin'
    },
    isAuthenticated: true
};

// Helper function to setup the component with mocks
const setupComponent = (authContextValue = mockAuthContext) => {
    return render(
        <AuthContext.Provider value={authContextValue}>
            <SocketContext.Provider value={mockSocket}>
                <Billing />
            </SocketContext.Provider>
        </AuthContext.Provider>
    );
};

// Mock successful fetch responses
const mockSuccessfulFetch = () => {
    global.fetch.mockImplementation((url) => {
        if (url.includes('/api/billing/invoices')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        id: '1',
                        invoiceNumber: 'INV-001',
                        patientName: 'John Doe',
                        date: '2023-01-01',
                        amount: 100,
                        status: 'pending',
                        description: 'General checkup'
                    }
                ])
            });
        } else if (url.includes('/api/billing/payment-methods')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        id: '1',
                        type: 'credit_card',
                        cardholderName: 'John Doe',
                        cardNumber: '****1234',
                        expiryMonth: '12',
                        expiryYear: '2025',
                        isDefault: true
                    }
                ])
            });
        } else if (url.includes('/api/billing/insurance')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        id: '1',
                        provider: 'Blue Cross',
                        policyNumber: 'POL123456',
                        policyHolder: 'John Doe',
                        coverageType: 'health'
                    }
                ])
            });
        }
        
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
        });
    });
};

// Reset mocks before each test
beforeEach(() => {
    global.fetch.mockReset();
    mockSocket.on.mockReset();
    mockSocket.off.mockReset();
    mockSocket.emit.mockReset();
});

describe('Billing Component', () => {
    test('renders the billing component with tabs', async () => {
        mockSuccessfulFetch();
        setupComponent();
        
        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Check if tabs are rendered
        expect(screen.getByText('Invoices')).toBeInTheDocument();
        expect(screen.getByText('Payment Methods')).toBeInTheDocument();
        expect(screen.getByText('Insurance')).toBeInTheDocument();
    });
    
    test('fetches invoices on component mount', async () => {
        mockSuccessfulFetch();
        setupComponent();
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/billing/invoices');
        });
    });
    
    test('fetches payment methods on component mount', async () => {
        mockSuccessfulFetch();
        setupComponent();
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/billing/payment-methods');
        });
    });
    
    test('fetches insurance information on component mount', async () => {
        mockSuccessfulFetch();
        setupComponent();
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/billing/insurance');
        });
    });
    
    test('switches between tabs when clicked', async () => {
        mockSuccessfulFetch();
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Initially, Invoices tab should be active
        expect(screen.getByTestId('invoice-list')).toBeInTheDocument();
        
        // Click on Payment Methods tab
        fireEvent.click(screen.getByText('Payment Methods'));
        expect(screen.getByTestId('payment-methods')).toBeInTheDocument();
        
        // Click on Insurance tab
        fireEvent.click(screen.getByText('Insurance'));
        expect(screen.getByText('Insurance Information')).toBeInTheDocument();
        
        // Click back to Invoices tab
        fireEvent.click(screen.getByText('Invoices'));
        expect(screen.getByTestId('invoice-list')).toBeInTheDocument();
    });
    
    test('handles invoice search and filtering', async () => {
        mockSuccessfulFetch();
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Find search input and type in it
        const searchInput = screen.getByPlaceholderText('Search invoices...');
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        
        // Check if search term state is updated (indirectly by checking if it's passed to InvoiceList)
        expect(searchInput.value).toBe('test search');
        
        // Test status filter
        const statusFilter = screen.getByLabelText('Status');
        fireEvent.change(statusFilter, { target: { value: 'paid' } });
        expect(statusFilter.value).toBe('paid');
        
        // Test date filter
        const dateFilter = screen.getByLabelText('Date');
        fireEvent.change(dateFilter, { target: { value: 'last30' } });
        expect(dateFilter.value).toBe('last30');
    });
    
    test('handles creating a new invoice', async () => {
        mockSuccessfulFetch();
        
        // Mock the POST request for creating an invoice
        global.fetch.mockImplementation((url, options) => {
            if (url === '/api/billing/invoices' && options.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: '2',
                        invoiceNumber: 'INV-002',
                        patientName: 'Jane Doe',
                        date: '2023-02-01',
                        amount: 200,
                        status: 'pending',
                        description: 'Specialist consultation'
                    })
                });
            }
            
            // Default response for other fetch calls
            return mockSuccessfulFetch()(url);
        });
        
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Click on Create Invoice button
        fireEvent.click(screen.getByText('Create Invoice'));
        
        // Check if modal is opened
        expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
        
        // Fill out the form
        fireEvent.change(screen.getByLabelText('Patient Name*'), { target: { value: 'Jane Doe' } });
        fireEvent.change(screen.getByLabelText('Amount ($)*'), { target: { value: '200' } });
        fireEvent.change(screen.getByLabelText('Description*'), { target: { value: 'Specialist consultation' } });
        
        // Submit the form
        fireEvent.click(screen.getByText('Create'));
        
        // Check if fetch was called with correct data
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/billing/invoices', expect.objectContaining({
                method: 'POST',
                body: expect.any(String)
            }));
        });
    });
    
    test('handles viewing an invoice', async () => {
        mockSuccessfulFetch();
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Click on View Invoice button in the mocked InvoiceList
        fireEvent.click(screen.getByTestId('view-invoice-btn'));
        
        // Check if modal is opened
        await waitFor(() => {
            expect(screen.getByText('Invoice Details')).toBeInTheDocument();
        });
    });
    
    test('handles paying an invoice', async () => {
        mockSuccessfulFetch();
        
        // Mock the POST request for paying an invoice
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/api/billing/invoices/1/pay') && options.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: '1',
                        invoiceNumber: 'INV-001',
                        status: 'paid'
                    })
                });
            }
            
            // Default response for other fetch calls
            return mockSuccessfulFetch()(url);
        });
        
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Click on Pay Invoice button in the mocked InvoiceList
        fireEvent.click(screen.getByTestId('pay-invoice-btn'));
        
        // Check if payment modal is opened
        await waitFor(() => {
            expect(screen.getByText('Pay Invoice')).toBeInTheDocument();
        });
        
        // Select a payment method and submit
        fireEvent.click(screen.getByTestId('select-payment-btn'));
        fireEvent.click(screen.getByText('Process Payment'));
        
        // Check if fetch was called with correct data
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/billing/invoices/1/pay', expect.objectContaining({
                method: 'POST',
                body: expect.any(String)
            }));
        });
    });
    
    test('handles deleting an invoice', async () => {
        mockSuccessfulFetch();
        
        // Mock the DELETE request
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/api/billing/invoices/1') && options.method === 'DELETE') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                });
            }
            
            // Default response for other fetch calls
            return mockSuccessfulFetch()(url);
        });
        
        // Mock window.confirm to return true
        window.confirm = jest.fn().mockImplementation(() => true);
        
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Click on Delete Invoice button in the mocked InvoiceList
        fireEvent.click(screen.getByTestId('delete-invoice-btn'));
        
        // Check if confirmation was shown
        expect(window.confirm).toHaveBeenCalled();
        
        // Check if fetch was called with correct method
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/billing/invoices/1', expect.objectContaining({
                method: 'DELETE'
            }));
        });
    });
    
    test('handles adding a payment method', async () => {
        mockSuccessfulFetch();
        
        // Mock the POST request for adding a payment method
        global.fetch.mockImplementation((url, options) => {
            if (url === '/api/billing/payment-methods' && options.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: '2',
                        type: 'credit_card',
                        cardholderName: 'Jane Doe',
                        cardNumber: '****5678'
                    })
                });
            }
            
            // Default response for other fetch calls
            return mockSuccessfulFetch()(url);
        });
        
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Switch to Payment Methods tab
        fireEvent.click(screen.getByText('Payment Methods'));
        
        // Click on Add Payment Method button in the mocked PaymentMethods
        fireEvent.click(screen.getByTestId('add-payment-btn'));
        
        // Check if fetch was called with correct data
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/billing/payment-methods', expect.objectContaining({
                method: 'POST',
                body: expect.any(String)
            }));
        });
    });
    
    test('handles adding insurance information', async () => {
        mockSuccessfulFetch();
        
        // Mock the POST request for adding insurance
        global.fetch.mockImplementation((url, options) => {
            if (url === '/api/billing/insurance' && options.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: '2',
                        provider: 'Test Insurance',
                        policyNumber: 'POL654321'
                    })
                });
            }
            
            // Default response for other fetch calls
            return mockSuccessfulFetch()(url);
        });
        
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Switch to Insurance tab
        fireEvent.click(screen.getByText('Insurance'));
        
        // Click on Add Insurance button
        fireEvent.click(screen.getByText('Add Insurance'));
        
        // Check if insurance modal is opened
        expect(screen.getByTestId('insurance-modal')).toBeInTheDocument();
        
        // Save insurance
        fireEvent.click(screen.getByTestId('save-insurance-btn'));
        
        // Check if fetch was called with correct data
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/billing/insurance', expect.objectContaining({
                method: 'POST'
            }));
        });
    });
    
    test('handles WebSocket events for real-time updates', async () => {
        mockSuccessfulFetch();
        setupComponent();
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Check if socket listeners were set up
        expect(mockSocket.on).toHaveBeenCalledWith('invoiceCreated', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('invoiceUpdated', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('invoiceDeleted', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('paymentMethodCreated', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('paymentMethodUpdated', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('paymentMethodDeleted', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('insuranceCreated', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('insuranceUpdated', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('insuranceDeleted', expect.any(Function));
        
        // Simulate a WebSocket event
        const invoiceCreatedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'invoiceCreated')[1];
        
        // Call the handler with a new invoice
        invoiceCreatedHandler({
            id: '3',
            invoiceNumber: 'INV-003',
            patientName: 'New Patient',
            date: '2023-03-01',
            amount: 300,
            status: 'pending',
            description: 'Emergency visit'
        });
        
        // The state update should happen, but we can't easily test it directly
        // We could check if the component re-renders with the new data if needed
    });
    
    test('handles errors when fetching data', async () => {
        // Mock fetch to return an error
        global.fetch.mockImplementation(() => {
            return Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ message: 'Failed to fetch data' })
            });
        });
        
        setupComponent();
        
        // Wait for error to be displayed
        await waitFor(() => {
            expect(screen.getByText('Error: Failed to fetch data')).toBeInTheDocument();
        });
    });
    
    test('restricts access based on user role', async () => {
        mockSuccessfulFetch();
        
        // Render with a patient role
        setupComponent({
            user: {
                id: 'user2',
                name: 'Patient User',
                role: 'patient'
            },
            isAuthenticated: true
        });
        
        // Wait for component to load
        await waitFor(() => {
            expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
        });
        
        // Patient should not see Create Invoice button
        expect(screen.queryByText('Create Invoice')).not.toBeInTheDocument();
    });
}); 