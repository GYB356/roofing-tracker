import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { SocketProvider } from '../../context/SocketContext';
import StaffScheduling from '../../pages/StaffScheduling';
import axios from 'axios';

// Mock the modules
jest.mock('axios');
jest.mock('../../context/SocketContext', () => ({
  ...jest.requireActual('../../context/SocketContext'),
  useSocket: () => ({
    socket: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    },
    updateSchedule: jest.fn()
  })
}));

describe('StaffScheduling Component', () => {
  const mockSchedules = [
    {
      id: 'schedule-1',
      staffId: 'staff-1',
      staffName: 'Dr. Smith',
      shiftType: 'regular',
      department: 'Cardiology',
      startTime: '2024-03-01T09:00:00Z',
      endTime: '2024-03-01T17:00:00Z',
      notes: 'Morning shift'
    },
    {
      id: 'schedule-2',
      staffId: 'staff-2',
      staffName: 'Dr. Johnson',
      shiftType: 'on-call',
      department: 'Emergency',
      startTime: '2024-03-01T17:00:00Z',
      endTime: '2024-03-02T09:00:00Z',
      notes: 'Night shift'
    }
  ];

  const renderComponent = (role = 'admin') => {
    const mockUser = {
      id: 'user-1',
      role: role
    };

    return render(
      <MemoryRouter>
        <AuthProvider value={{ user: mockUser, hasRole: () => role === 'admin' || role === 'staff' }}>
          <SocketProvider>
            <StaffScheduling />
          </SocketProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockSchedules });
  });

  it('renders access denied for unauthorized users', () => {
    renderComponent('patient');
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('loads and displays staff schedules', async () => {
    renderComponent();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/staff-schedules');
    });

    expect(screen.getByText('Staff Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
  });

  it('allows admin to add new schedule', async () => {
    renderComponent();

    const newSchedule = {
      id: 'schedule-3',
      staffId: 'staff-3',
      staffName: 'Dr. Brown',
      shiftType: 'regular',
      department: 'Pediatrics',
      startTime: '2024-03-02T09:00:00Z',
      endTime: '2024-03-02T17:00:00Z',
      notes: 'Morning shift'
    };

    axios.post.mockResolvedValueOnce({ data: newSchedule });

    // Click add schedule button
    const addButton = await screen.findByText('Add Schedule');
    fireEvent.click(addButton);

    // Fill out the form
    const staffIdInput = screen.getByLabelText(/Staff Member/i);
    const departmentInput = screen.getByLabelText(/Department/i);
    const notesInput = screen.getByLabelText(/Notes/i);

    fireEvent.change(staffIdInput, { target: { value: 'staff-3' } });
    fireEvent.change(departmentInput, { target: { value: 'Pediatrics' } });
    fireEvent.change(notesInput, { target: { value: 'Morning shift' } });

    // Submit the form
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it('allows admin to edit schedule', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click on a schedule to edit
    const scheduleCard = screen.getByText('Dr. Smith').closest('div');
    fireEvent.click(scheduleCard);

    // Update the notes
    const notesInput = screen.getByLabelText(/Notes/i);
    fireEvent.change(notesInput, { target: { value: 'Updated shift notes' } });

    // Save the changes
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
  });

  it('allows admin to delete schedule', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click on a schedule to edit
    const scheduleCard = screen.getByText('Dr. Smith').closest('div');
    fireEvent.click(scheduleCard);

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/staff-schedules/schedule-1');
    });
  });

  it('handles error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to load schedules'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load schedules')).toBeInTheDocument();
    });
  });

  it('updates schedule display when receiving WebSocket events', async () => {
    const { rerender } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Simulate receiving a WebSocket update
    const updatedSchedule = {
      ...mockSchedules[0],
      notes: 'Updated via WebSocket'
    };

    axios.get.mockResolvedValueOnce({ data: [updatedSchedule, mockSchedules[1]] });
    rerender(
      <MemoryRouter>
        <AuthProvider value={{ user: { id: 'user-1', role: 'admin' }, hasRole: () => true }}>
          <SocketProvider>
            <StaffScheduling />
          </SocketProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Updated via WebSocket')).toBeInTheDocument();
    });
  });

  it('restricts edit/delete actions for non-admin users', async () => {
    renderComponent('staff');

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    expect(screen.queryByText('Add Schedule')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('renders the Staff Scheduling page', () => {
    render(<StaffScheduling />);
    expect(screen.getByText('Staff Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the Staff Scheduling page.')).toBeInTheDocument();
  });
}); 