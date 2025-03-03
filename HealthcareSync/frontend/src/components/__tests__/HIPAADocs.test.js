import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import HIPAADocs from '../../pages/HIPAADocs';
import axios from 'axios';

// Mock the modules
jest.mock('axios');

describe('HIPAADocs Component', () => {
  const mockDocuments = [
    {
      id: 'doc-1',
      title: 'Privacy Policy',
      version: '1.0',
      content: 'Privacy policy content...'
    },
    {
      id: 'doc-2',
      title: 'Patient Rights',
      version: '1.1',
      content: 'Patient rights content...'
    }
  ];

  const mockAcknowledgments = [
    {
      id: 'ack-1',
      documentId: 'doc-1',
      userId: 'user-1',
      acknowledgedAt: '2024-03-01T12:00:00Z'
    }
  ];

  const renderComponent = (role = 'admin') => {
    const mockUser = {
      id: 'user-1',
      role: role
    };

    return render(
      <MemoryRouter>
        <AuthProvider value={{ user: mockUser }}>
          <HIPAADocs />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get
      .mockResolvedValueOnce({ data: mockDocuments })
      .mockResolvedValueOnce({ data: mockAcknowledgments });
  });

  it('loads and displays HIPAA documents', async () => {
    renderComponent();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/hipaa/documents');
    });

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Patient Rights')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getByText('Version 1.1')).toBeInTheDocument();
  });

  it('shows acknowledgment status', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Acknowledged')).toBeInTheDocument();
    });
  });

  it('allows viewing document content', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('View Document')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('View Document')[0]);

    expect(screen.getByText('Privacy policy content...')).toBeInTheDocument();
  });

  it('allows acknowledging documents', async () => {
    axios.post.mockResolvedValueOnce({ data: {
      id: 'ack-2',
      documentId: 'doc-2',
      userId: 'user-1',
      acknowledgedAt: '2024-03-01T13:00:00Z'
    }});

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('View Document')).toHaveLength(2);
    });

    // Open the second document (unacknowledged)
    fireEvent.click(screen.getAllByText('View Document')[1]);

    // Click acknowledge button
    fireEvent.click(screen.getByText('Acknowledge'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/hipaa/acknowledgments', {
        documentId: 'doc-2',
        userId: 'user-1'
      });
    });
  });

  it('handles error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to load documents'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load HIPAA documents')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    renderComponent();
    expect(screen.getByText('Loading HIPAA documents...')).toBeInTheDocument();
  });

  it('closes document modal', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('View Document')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('View Document')[0]);
    expect(screen.getByText('Privacy policy content...')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Privacy policy content...')).not.toBeInTheDocument();
  });

  it('handles acknowledgment errors', async () => {
    axios.post.mockRejectedValueOnce(new Error('Failed to acknowledge document'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('View Document')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('View Document')[1]);
    fireEvent.click(screen.getByText('Acknowledge'));

    await waitFor(() => {
      expect(screen.getByText('Failed to acknowledge document')).toBeInTheDocument();
    });
  });

  it('refreshes acknowledgments after successful acknowledgment', async () => {
    const newAcknowledgment = {
      id: 'ack-2',
      documentId: 'doc-2',
      userId: 'user-1',
      acknowledgedAt: '2024-03-01T13:00:00Z'
    };

    axios.post.mockResolvedValueOnce({ data: newAcknowledgment });
    axios.get
      .mockResolvedValueOnce({ data: mockDocuments })
      .mockResolvedValueOnce({ data: mockAcknowledgments })
      .mockResolvedValueOnce({ data: [...mockAcknowledgments, newAcknowledgment] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('View Document')).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByText('View Document')[1]);
    fireEvent.click(screen.getByText('Acknowledge'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/hipaa/acknowledgments?userId=user-1');
      expect(screen.getAllByText('Acknowledged')).toHaveLength(2);
    });
  });
}); 