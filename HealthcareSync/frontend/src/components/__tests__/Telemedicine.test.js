import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { SocketProvider } from '../../context/SocketContext';
import Telemedicine from '../../pages/Telemedicine';
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
    joinTelemedicineSession: jest.fn(),
    leaveTelemedicineSession: jest.fn()
  })
}));

// Mock getUserMedia
const mockGetUserMedia = jest.fn(async () => ({
  getTracks: () => [{
    enabled: true,
    stop: jest.fn()
  }]
}));

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  }
});

// Mock RTCPeerConnection
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  addTrack: jest.fn(),
  createOffer: jest.fn().mockResolvedValue({ sdp: 'test-sdp' }),
  setLocalDescription: jest.fn(),
  setRemoteDescription: jest.fn(),
  addIceCandidate: jest.fn(),
  close: jest.fn(),
  ontrack: null,
  onicecandidate: null
}));

describe('Telemedicine Component', () => {
  const mockSession = {
    id: 'test-session',
    doctorId: 'doctor-1',
    patientId: 'patient-1',
    scheduledTime: new Date().toISOString(),
    status: 'scheduled'
  };

  const renderComponent = (role = 'doctor') => {
    const mockUser = {
      id: 'user-1',
      role: role
    };

    return render(
      <MemoryRouter initialEntries={['/telemedicine/test-session']}>
        <AuthProvider value={{ user: mockUser, hasRole: () => true }}>
          <SocketProvider>
            <Routes>
              <Route path="/telemedicine/:sessionId" element={<Telemedicine />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockSession });
  });

  it('renders access denied for unauthorized users', () => {
    const mockUser = {
      id: 'user-1',
      role: 'staff'
    };

    render(
      <MemoryRouter>
        <AuthProvider value={{ user: mockUser, hasRole: () => false }}>
          <SocketProvider>
            <Telemedicine />
          </SocketProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('loads and displays telemedicine session', async () => {
    renderComponent();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/telemedicine/sessions/test-session');
    });

    expect(screen.getByText(/Telemedicine Session/)).toBeInTheDocument();
  });

  it('handles media stream initialization', async () => {
    renderComponent();

    const startCallButton = await screen.findByText('Start Call');
    fireEvent.click(startCallButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: true
      });
    });
  });

  it('toggles audio and video', async () => {
    renderComponent();

    // Start the call
    const startCallButton = await screen.findByText('Start Call');
    fireEvent.click(startCallButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    // Toggle audio
    const audioButton = screen.getByRole('button', { name: /audio/i });
    fireEvent.click(audioButton);

    // Toggle video
    const videoButton = screen.getByRole('button', { name: /video/i });
    fireEvent.click(videoButton);
  });

  it('handles error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to load session'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load session')).toBeInTheDocument();
    });
  });

  it('cleans up resources on unmount', async () => {
    const { unmount } = renderComponent();

    // Start the call
    const startCallButton = await screen.findByText('Start Call');
    fireEvent.click(startCallButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    unmount();

    // Verify cleanup
    expect(mockGetUserMedia().getTracks()[0].stop).toHaveBeenCalled();
  });

  it('renders the Telemedicine page', () => {
    render(<Telemedicine />);
    expect(screen.getByText('Telemedicine')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the Telemedicine page.')).toBeInTheDocument();
  });
}); 