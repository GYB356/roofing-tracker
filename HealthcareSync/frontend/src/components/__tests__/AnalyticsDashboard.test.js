import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import AnalyticsDashboard from '../../pages/AnalyticsDashboard';
import axios from 'axios';

// Mock the modules
jest.mock('axios');
jest.mock('recharts', () => ({
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>
}));

describe('AnalyticsDashboard Component', () => {
  const mockData = {
    dashboard: {
      patientCount: 1000,
      appointmentCount: 500,
      telemedicineSessionCount: 200,
      activeDevices: 50
    },
    appointments: {
      total: 500,
      byStatus: { scheduled: 200, completed: 250, cancelled: 50 },
      byMonth: { January: 100, February: 150, March: 250 }
    },
    telemedicine: {
      total: 200,
      byStatus: { scheduled: 80, completed: 100, cancelled: 20 },
      byDoctor: { 'doctor-1': 50, 'doctor-2': 75, 'doctor-3': 75 }
    }
  };

  const renderComponent = (role = 'admin') => {
    return render(
      <MemoryRouter>
        <AuthProvider value={{ user: { id: 'user-1', role }, hasRole: () => role === 'admin' }}>
          <AnalyticsDashboard />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockData).forEach(key => {
      axios.get.mockResolvedValueOnce({ data: mockData[key] });
    });
  });

  it('renders access denied for unauthorized users', () => {
    renderComponent('doctor');
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('loads and displays analytics data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/analytics/dashboard');
      expect(axios.get).toHaveBeenCalledWith('/api/analytics/appointments');
      expect(axios.get).toHaveBeenCalledWith('/api/analytics/telemedicine');
    });

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    expect(screen.getAllByTestId('line-chart')).toHaveLength(2);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('allows changing timeframe', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Last Month')).toBeInTheDocument();
    });

    const timeframeSelect = screen.getByRole('combobox');
    fireEvent.change(timeframeSelect, { target: { value: 'week' } });

    expect(timeframeSelect.value).toBe('week');
  });

  it('handles error states', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to load analytics'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    renderComponent();
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });
}); 