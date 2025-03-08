import React, { useState, useEffect } from 'react';
import { Chart } from 'chart.js/auto';
import { format, subDays } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTable } from 'react-table';

const AuditDashboard = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [userIdFilter, setUserIdFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [chartInstance, setChartInstance] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [startDate, endDate, userIdFilter, actionTypeFilter]);

  const fetchAuditLogs = async () => {
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      userId: userIdFilter,
      actionType: actionTypeFilter
    });

    try {
      const response = await fetch(`/api/audit-logs?${params}`);
      const data = await response.json();
      setAuditLogs(data.logs);
      initializeChart(data.stats);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const initializeChart = (stats) => {
    if (chartInstance) chartInstance.destroy();

    const ctx = document.getElementById('auditTimeline');
    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stats.labels,
        datasets: [{
          label: 'Access Events',
          data: stats.data,
          borderColor: '#3b82f6',
          tension: 0.1
        }]
      }
    });
    setChartInstance(newChart);
  };

  const columns = React.useMemo(
    () => [
      { Header: 'Timestamp', accessor: 'timestamp' },
      { Header: 'User ID', accessor: 'userId' },
      { Header: 'Action', accessor: 'actionType' },
      { Header: 'Endpoint', accessor: 'endpoint' },
      { Header: 'Status', accessor: 'statusCode' },
      { Header: 'Response Time', accessor: 'responseTime' }
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: auditLogs });

  const handleExport = async () => {
    try {
      const response = await fetch('/api/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      });
      // Handle file download
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const detectAnomalies = () => {
    const failedLogins = auditLogs.filter(log => 
      log.actionType === 'login' && log.statusCode === 401
    );
    // Add anomaly detection logic
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audit Dashboard</h1>
        <button 
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Timeline Overview</h2>
          <canvas id="auditTimeline" />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex gap-2">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  className="border rounded p-2 w-full"
                />
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  className="border rounded p-2 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <input
                type="text"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="border rounded p-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Action Type</label>
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="border rounded p-2 w-full"
              >
                <option value="">All</option>
                <option value="access">Access</option>
                <option value="modify">Modify</option>
                <option value="login">Login</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Audit Log Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table {...getTableProps()} className="w-full">
            <thead className="bg-gray-50">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th
                      {...column.getHeaderProps()}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              {...getTableBodyProps()}
              className="divide-y divide-gray-200"
            >
              {rows.map(row => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map(cell => (
                      <td
                        {...cell.getCellProps()}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;