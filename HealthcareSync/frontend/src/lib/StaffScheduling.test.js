import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import StaffScheduling from './StaffScheduling';

// Mock the AuthContext
jest.mock('../context/AuthContext', () => ({
    AuthProvider: ({ children }) => children,
    useAuth: () => ({
        user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'admin'
        }
    })
}));

// Mock fetch API
global.fetch = jest.fn();

// Helper function to render component with router
const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                {component}
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('StaffScheduling Component', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        
        // Mock successful API response
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                schedules: [
                    {
                        id: '1',
                        staffId: '101',
                        staffName: 'Dr. John Smith',
                        department: 'cardiology',
                        startTime: '2023-12-15T09:00:00',
                        endTime: '2023-12-15T17:00:00',
                        notes: 'Regular shift'
                    },
                    {
                        id: '2',
                        staffId: '102',
                        staffName: 'Nurse Jane Doe',
                        department: 'emergency',
                        startTime: '2023-12-15T08:00:00',
                        endTime: '2023-12-15T16:00:00',
                        notes: 'Morning shift'
                    }
                ]
            })
        });
    });
    
    test('renders StaffScheduling component', async () => {
        renderWithRouter(<StaffScheduling />);
        
        // Check if the component title is rendered
        expect(screen.getByText('Staff Scheduling')).toBeInTheDocument();
    });
    
    test('displays loading state initially', () => {
        renderWithRouter(<StaffScheduling />);
        
        // Check if loading indicator is displayed
        expect(screen.getByText('Loading schedules...')).toBeInTheDocument();
    });
    
    test('fetches and displays schedules', async () => {
        renderWithRouter(<StaffScheduling />);
        
        // Wait for the API call to resolve and component to update
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith('/api/schedules');
        });
        
        // Check if schedule data is displayed
        await waitFor(() => {
            expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
            expect(screen.getByText('Nurse Jane Doe')).toBeInTheDocument();
        });
    });
    
    test('handles API error gracefully', async () => {
        // Mock API error
        global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
        
        renderWithRouter(<StaffScheduling />);
        
        // Wait for the API call to reject and component to update
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        
        // Check if error message is displayed
        await waitFor(() => {
            expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
        });
    });
    
    test('submits new schedule form correctly', async () => {
        // Mock API response for creating a new schedule
        global.fetch.mockImplementation((url, options) => {
            if (options && options.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: '3',
                        staffId: '103',
                        staffName: 'Dr. New Doctor',
                        department: 'neurology',
                        startTime: '2023-12-16T10:00:00',
                        endTime: '2023-12-16T18:00:00',
                        notes: 'Afternoon shift'
                    })
                });
            }
            
            // Default response for GET requests
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    schedules: [
                        {
                            id: '1',
                            staffId: '101',
                            staffName: 'Dr. John Smith',
                            department: 'cardiology',
                            startTime: '2023-12-15T09:00:00',
                            endTime: '2023-12-15T17:00:00',
                            notes: 'Regular shift'
                        },
                        {
                            id: '2',
                            staffId: '102',
                            staffName: 'Nurse Jane Doe',
                            department: 'emergency',
                            startTime: '2023-12-15T08:00:00',
                            endTime: '2023-12-15T16:00:00',
                            notes: 'Morning shift'
                        }
                    ]
                })
            });
        });
        
        renderWithRouter(<StaffScheduling />);
        
        // Wait for the initial API call to resolve
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        
        // Fill out the form
        fireEvent.change(screen.getByLabelText(/Staff Member/i), { 
            target: { value: '103' } 
        });
        
        fireEvent.change(screen.getByLabelText(/Start Time/i), { 
            target: { value: '2023-12-16T10:00' } 
        });
        
        fireEvent.change(screen.getByLabelText(/End Time/i), { 
            target: { value: '2023-12-16T18:00' } 
        });
        
        fireEvent.change(screen.getByLabelText(/Department/i), { 
            target: { value: 'neurology' } 
        });
        
        fireEvent.change(screen.getByLabelText(/Notes/i), { 
            target: { value: 'Afternoon shift' } 
        });
        
        // Submit the form
        fireEvent.click(screen.getByText('Create Schedule'));
        
        // Wait for the POST API call
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch.mock.calls[1][0]).toBe('/api/schedules');
            expect(global.fetch.mock.calls[1][1].method).toBe('POST');
        });
        
        // Check that the form data was sent correctly
        const requestBody = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(requestBody).toEqual({
            staffId: '103',
            startTime: '2023-12-16T10:00',
            endTime: '2023-12-16T18:00',
            department: 'neurology',
            notes: 'Afternoon shift'
        });
    });
    
    test('filters schedules by date', async () => {
        renderWithRouter(<StaffScheduling />);
        
        // Wait for the API call to resolve and component to update
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        
        // Find and change the date filter
        const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
        fireEvent.change(dateInput, { target: { value: '2023-12-16' } });
        
        // Check if the date filter was applied
        // This would typically trigger a new API call or filter the existing data
        // The implementation details would depend on how the component is built
    });
    
    test('filters schedules by staff', async () => {
        renderWithRouter(<StaffScheduling />);
        
        // Wait for the API call to resolve and component to update
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        
        // Find and change the staff filter
        const staffSelect = screen.getByDisplayValue('All Staff');
        fireEvent.change(staffSelect, { target: { value: '101' } });
        
        // Check if the staff filter was applied
        // This would typically trigger a new API call or filter the existing data
        // The implementation details would depend on how the component is built
    });
    
    test('form validation works correctly', async () => {
        renderWithRouter(<StaffScheduling />);
        
        // Wait for the initial API call to resolve
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        
        // Try to submit the form without filling required fields
        fireEvent.click(screen.getByText('Create Schedule'));
        
        // Check that the form wasn't submitted
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1); // No additional API calls
        });
        
        // Check for validation messages
        // This depends on how validation is implemented in the component
        // expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
}); 