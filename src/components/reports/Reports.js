// src/components/reports/Reports.js
import React, { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import api from '../../services/api';
import DashboardLayout from '../layout/DashboardLayout';
import ProjectStatusChart from './ProjectStatusChart';
import RevenueChart from './RevenueChart';
import MaterialsUsageChart from './MaterialsUsageChart';
import ProjectCompletionTimeChart from './ProjectCompletionTimeChart';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [reportType, setReportType] = useState('overview');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports', {
        params: {
          ...dateRange,
          type: reportType
        }
      });
      
      setReportData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Status</h3>
              <ProjectStatusChart data={reportData.projectStatus} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue</h3>
              <RevenueChart data={reportData.revenue} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Materials Usage</h3>
              <MaterialsUsageChart data={reportData.materialsUsage} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Completion Time</h3>
              <ProjectCompletionTimeChart data={reportData.completionTime} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Average Completion Time</h4>
                  <p className="mt-2 text-3xl font-bold text-blue-600">{reportData.performance.avgCompletionDays} days</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {reportData.performance.completionChange >= 0 ? '+' : ''}
                    {reportData.performance.completionChange} days from previous period
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Projects Completed On Time</h4>
                  <p className="mt-2 text-3xl font-bold text-green-600">{reportData.performance.onTimePercentage}%</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {reportData.performance.completedOnTime} out of {reportData.performance.totalCompleted} projects
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Client Satisfaction</h4>
                  <p className="mt-2 text-3xl font-bold text-purple-600">{reportData.performance.clientSatisfaction}/5</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Based on {reportData.performance.totalReviews} client reviews
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Select a report type to view data</div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Reports & Analytics</h1>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Print Report
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
              Report Type
            </label>
            <select
              id="reportType"
              name="reportType"
              value={reportType}
              onChange={handleReportTypeChange}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="financial">Financial</option>
              <option value="materials">Materials</option>
              <option value="performance">Performance</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        renderReportContent()
      )}
    </DashboardLayout>
  );
};

export default Reports;

// src/components/reports/ProjectStatusChart.js
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const ProjectStatusChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} projects`, 'Count']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ProjectStatusChart;

// src/components/reports/RevenueChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const RevenueChart = ({ data, showExpenses = false }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value.toLocaleString()}`, '']} />
        <Legend />
        <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" />
        {showExpenses && <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />}
        {showExpenses && <Bar dataKey="profit" name="Profit" fill="#10B981" />}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;

// src/components/reports/MaterialsUsageChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MaterialsUsageChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip 
          formatter={(value, name, props) => {
            return [`${value} ${props.payload.unit}`, name];
          }} 
        />
        <Legend />
        <Bar dataKey="value" name="Quantity Used" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MaterialsUsageChart;

// src/components/reports/ProjectCompletionTimeChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ProjectCompletionTimeChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} days`, '']} />
        <Legend />
        <Line type="monotone" dataKey="actual" name="Actual Days" stroke="#3B82F6" />
        <Line type="monotone" dataKey="estimated" name="Estimated Days" stroke="#F59E0B" strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ProjectCompletionTimeChart;
              <ProjectCompletionTimeChart data={reportData.completionTime} />
            </div>
          </div>
        );
      case 'financial':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue and Expenses</h3>
              <RevenueChart data={reportData.revenue} showExpenses={true} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Total Revenue</h4>
                  <p className="mt-2 text-3xl font-bold text-green-600">${reportData.summary.totalRevenue.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {reportData.summary.revenueChange >= 0 ? '+' : ''}
                    {reportData.summary.revenueChange}% from previous period
                  </p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Total Expenses</h4>
                  <p className="mt-2 text-3xl font-bold text-red-600">${reportData.summary.totalExpenses.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {reportData.summary.expenseChange >= 0 ? '+' : ''}
                    {reportData.summary.expenseChange}% from previous period
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Net Profit</h4>
                  <p className="mt-2 text-3xl font-bold text-blue-600">${reportData.summary.netProfit.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Profit Margin: {reportData.summary.profitMargin}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Projects by Revenue</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expenses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.topProjects.map(project => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a href={`/projects/${project.id}`} className="text-blue-600 hover:text-blue-900">
                            {project.name}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === 'completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${project.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${project.expenses.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={`${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(project.profit).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'materials':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Materials Usage</h3>
              <MaterialsUsageChart data={reportData.materialsUsage} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Materials</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.topMaterials.map(material => (
                      <tr key={material.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{material.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.totalUsed} {material.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${material.totalCost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.currentStock} {material.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Completion Time</h3>