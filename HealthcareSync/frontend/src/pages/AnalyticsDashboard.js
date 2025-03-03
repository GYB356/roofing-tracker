import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AnalyticsDashboard = () => {
  const { user, hasRole } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasRole(['admin'])) {
      setError('Access Denied');
      return;
    }

    // Fetch analytics data
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/overview');
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError('Failed to load analytics data');
      }
    };

    fetchAnalytics();
  }, [hasRole]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!analyticsData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="analytics-dashboard p-4">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      <div>
        <h2 className="text-xl">Overview</h2>
        <p>Total Users: {analyticsData.totalUsers}</p>
        <p>Total Appointments: {analyticsData.totalAppointments}</p>
        <p>Total Revenue: ${analyticsData.totalRevenue}</p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 