import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Chart as ChartJS,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import MetricEntryForm from './MetricEntryForm';
import DeviceIntegrationPanel from './DeviceIntegrationPanel';
import AlertThresholdSettings from './AlertThresholdSettings';
import { useAuth } from '../../contexts/AuthContext';
import { fetchHealthMetrics, syncDeviceMetrics } from '../../services/healthMetricsService';

ChartJS.register(
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function HealthMetricsPage() {
  const { authAxios } = useAuth();
  const [metricData, setMetricData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('blood_pressure');
  const [dateRange, setDateRange] = useState([
    new Date(new Date().setMonth(new Date().getMonth() - 1)),
    new Date(),
  ]);
  const [alertThresholds, setAlertThresholds] = useState({
    blood_pressure: { systolic: { min: 90, max: 120 } },
    glucose: { fasting: { min: 70, max: 100 } }
  });
  const [isLoading, setIsLoading] = useState(true);

  const metricsConfig = {
    blood_pressure: { label: 'Blood Pressure', unit: 'mmHg', deviceType: 'blood_pressure_monitor' },
    glucose: { label: 'Glucose', unit: 'mg/dL', deviceType: 'glucose_meter' },
    heart_rate: { label: 'Heart Rate', unit: 'bpm', deviceType: 'heart_rate_monitor' },
    weight: { label: 'Weight', unit: 'kg', deviceType: 'smart_scale' },
    medication_adherence: { label: 'Medication Adherence', unit: '%', deviceType: null },
  };

  const loadMetricsData = useCallback(async () => {
    try {
      const data = await fetchHealthMetrics(authAxios, {
        metricType: selectedMetric,
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString()
      });
      setMetricData(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authAxios, selectedMetric, dateRange]);

  useEffect(() => {
    loadMetricsData();
  }, [loadMetricsData]);

  const handleDeviceSync = async (deviceType) => {
    try {
      const newMetrics = await syncDeviceMetrics(authAxios, deviceType);
      setMetricData(prev => [...prev, ...newMetrics]);
    } catch (error) {
      console.error('Device sync failed:', error);
    }
  };

  const chartData = {
    datasets: [{
      label: metricsConfig[selectedMetric].label,
      data: metricData.map(entry => ({
        x: new Date(entry.timestamp),
        y: entry.value
      })),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    }]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Health Metrics Dashboard
          </h1>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              aria-label="Select health metric"
            >
              {Object.entries(metricsConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            
            <DatePicker
              selectsRange
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              onChange={([start, end]) => setDateRange([start, end])}
              className="rounded-md border-gray-300 shadow-sm w-full md:w-64"
              aria-label="Select date range"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 h-96">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  Loading chart...
                </div>
              ) : (
                <Line data={chartData} options={{
                  ...chartOptions,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => 
                          `${ctx.dataset.label}: ${ctx.parsed.y}${metricsConfig[selectedMetric].unit}`
                      }
                    }
                  }
                }} />
              )}
            </div>
            
            <MetricEntryForm 
              metricType={selectedMetric}
              onSuccess={loadMetricsData}
              unit={metricsConfig[selectedMetric].unit}
            />
          </div>
          
          <div className="space-y-6">
            <DeviceIntegrationPanel
              deviceType={metricsConfig[selectedMetric].deviceType}
              onSync={handleDeviceSync}
            />
            
            <AlertThresholdSettings
              metricType={selectedMetric}
              thresholds={alertThresholds[selectedMetric]}
              onUpdate={(newThresholds) => setAlertThresholds(prev => ({
                ...prev,
                [selectedMetric]: newThresholds
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time',
      time: { unit: 'day' },
      grid: { display: false },
      ticks: { color: '#6b7280' }
    },
    y: {
      grid: { color: '#e5e7eb' },
      ticks: { color: '#6b7280' },
      title: { display: false }
    }
  },
  plugins: {
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#f9fafb',
      bodyColor: '#f9fafb',
      borderColor: '#374151',
      borderWidth: 1
    }
  }
};