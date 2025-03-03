import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// Note: In a real implementation, you would import chart libraries like Chart.js, Recharts, etc.

const AnalyticsDashboard = () => {
    const [analyticsData, setAnalyticsData] = useState({
        patientMetrics: null,
        financialMetrics: null,
        operationalMetrics: null,
        clinicalMetrics: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('month'); // day, week, month, year
    const [department, setDepartment] = useState('all');
    
    const { user } = useAuth();
    
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                // API calls would go here
                const patientResponse = await fetch(`/api/analytics/patients?timeRange=${timeRange}&department=${department}`);
                const financialResponse = await fetch(`/api/analytics/financial?timeRange=${timeRange}&department=${department}`);
                const operationalResponse = await fetch(`/api/analytics/operational?timeRange=${timeRange}&department=${department}`);
                const clinicalResponse = await fetch(`/api/analytics/clinical?timeRange=${timeRange}&department=${department}`);
                
                const patientData = await patientResponse.json();
                const financialData = await financialResponse.json();
                const operationalData = await operationalResponse.json();
                const clinicalData = await clinicalResponse.json();
                
                setAnalyticsData({
                    patientMetrics: patientData,
                    financialMetrics: financialData,
                    operationalMetrics: operationalData,
                    clinicalMetrics: clinicalData
                });
            } catch (err) {
                setError(err.message);
                console.error('Error fetching analytics data:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAnalyticsData();
    }, [timeRange, department]);
    
    const handleTimeRangeChange = (e) => {
        setTimeRange(e.target.value);
    };
    
    const handleDepartmentChange = (e) => {
        setDepartment(e.target.value);
    };
    
    // Mock data for visualization
    const mockPatientData = {
        totalPatients: 1250,
        newPatients: 78,
        returningPatients: 45,
        averageAge: 42,
        genderDistribution: { male: 48, female: 51, other: 1 },
        patientsByDepartment: [
            { department: 'Cardiology', count: 320 },
            { department: 'Neurology', count: 280 },
            { department: 'Pediatrics', count: 210 },
            { department: 'Oncology', count: 190 },
            { department: 'Emergency', count: 250 }
        ]
    };
    
    const mockFinancialData = {
        totalRevenue: 1250000,
        revenueByDepartment: [
            { department: 'Cardiology', revenue: 420000 },
            { department: 'Neurology', revenue: 380000 },
            { department: 'Pediatrics', revenue: 150000 },
            { department: 'Oncology', revenue: 210000 },
            { department: 'Emergency', revenue: 90000 }
        ],
        insuranceClaims: {
            submitted: 850,
            approved: 720,
            denied: 95,
            pending: 35
        },
        averageClaimProcessingTime: 12 // days
    };
    
    const mockOperationalData = {
        bedOccupancy: 78, // percentage
        averageWaitTime: 24, // minutes
        staffUtilization: 82, // percentage
        equipmentUtilization: {
            mri: 65,
            ct: 72,
            xray: 58,
            ultrasound: 81
        }
    };
    
    const mockClinicalData = {
        readmissionRate: 4.2, // percentage
        averageLengthOfStay: 3.8, // days
        patientSatisfaction: 87, // percentage
        treatmentOutcomes: {
            excellent: 45,
            good: 32,
            fair: 18,
            poor: 5
        }
    };
    
    if (loading) return <div className="flex justify-center items-center h-64"><p>Loading analytics data...</p></div>;
    if (error) return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
    
    // Use mock data for demonstration
    const data = {
        patientMetrics: analyticsData.patientMetrics || mockPatientData,
        financialMetrics: analyticsData.financialMetrics || mockFinancialData,
        operationalMetrics: analyticsData.operationalMetrics || mockOperationalData,
        clinicalMetrics: analyticsData.clinicalMetrics || mockClinicalData
    };
    
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
            
            <div className="bg-white p-4 rounded shadow mb-6">
                <div className="flex flex-wrap justify-between items-center">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <div className="flex space-x-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Time Range</label>
                            <select 
                                value={timeRange}
                                onChange={handleTimeRangeChange}
                                className="p-2 border rounded"
                            >
                                <option value="day">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Department</label>
                            <select 
                                value={department}
                                onChange={handleDepartmentChange}
                                className="p-2 border rounded"
                            >
                                <option value="all">All Departments</option>
                                <option value="cardiology">Cardiology</option>
                                <option value="neurology">Neurology</option>
                                <option value="pediatrics">Pediatrics</option>
                                <option value="oncology">Oncology</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-2">Total Patients</h3>
                    <p className="text-3xl font-bold text-blue-600">{data.patientMetrics.totalPatients}</p>
                    <div className="flex justify-between mt-2 text-sm">
                        <span>New: {data.patientMetrics.newPatients}</span>
                        <span>Returning: {data.patientMetrics.returningPatients}</span>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-600">${(data.financialMetrics.totalRevenue / 1000).toFixed(1)}k</p>
                    <div className="mt-2 text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <p className="mt-1">70% of quarterly target</p>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-2">Bed Occupancy</h3>
                    <p className="text-3xl font-bold text-yellow-600">{data.operationalMetrics.bedOccupancy}%</p>
                    <div className="mt-2 text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${data.operationalMetrics.bedOccupancy}%` }}></div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-2">Patient Satisfaction</h3>
                    <p className="text-3xl font-bold text-purple-600">{data.clinicalMetrics.patientSatisfaction}%</p>
                    <div className="mt-2 text-sm">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${data.clinicalMetrics.patientSatisfaction}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-4">Patients by Department</h3>
                    <div className="h-64 flex items-end space-x-2">
                        {data.patientMetrics.patientsByDepartment.map((item, index) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                                <div 
                                    className="w-full bg-blue-500 rounded-t"
                                    style={{ 
                                        height: `${(item.count / Math.max(...data.patientMetrics.patientsByDepartment.map(d => d.count))) * 200}px` 
                                    }}
                                ></div>
                                <p className="text-xs mt-1 truncate w-full text-center">{item.department}</p>
                                <p className="text-xs font-semibold">{item.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-4">Revenue by Department</h3>
                    <div className="h-64 flex items-end space-x-2">
                        {data.financialMetrics.revenueByDepartment.map((item, index) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                                <div 
                                    className="w-full bg-green-500 rounded-t"
                                    style={{ 
                                        height: `${(item.revenue / Math.max(...data.financialMetrics.revenueByDepartment.map(d => d.revenue))) * 200}px` 
                                    }}
                                ></div>
                                <p className="text-xs mt-1 truncate w-full text-center">{item.department}</p>
                                <p className="text-xs font-semibold">${(item.revenue / 1000).toFixed(0)}k</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-4">Equipment Utilization</h3>
                    <div className="space-y-4">
                        {Object.entries(data.operationalMetrics.equipmentUtilization).map(([key, value]) => (
                            <div key={key}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium capitalize">{key}</span>
                                    <span className="text-sm font-medium">{value}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className={`h-2.5 rounded-full ${value > 80 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${value}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-4">Treatment Outcomes</h3>
                    <div className="flex items-center justify-center h-64">
                        <div className="w-48 h-48 rounded-full border-8 border-gray-200 relative">
                            {Object.entries(data.clinicalMetrics.treatmentOutcomes).map(([key, value], index, arr) => {
                                const total = Object.values(data.clinicalMetrics.treatmentOutcomes).reduce((a, b) => a + b, 0);
                                const percentage = (value / total) * 100;
                                
                                // Calculate the cumulative percentage for positioning
                                const prevPercentages = arr.slice(0, index).reduce((sum, [_, val]) => sum + (val / total) * 100, 0);
                                
                                // Colors for different outcomes
                                const colors = {
                                    excellent: '#10B981', // green
                                    good: '#3B82F6',      // blue
                                    fair: '#F59E0B',      // yellow
                                    poor: '#EF4444'       // red
                                };
                                
                                return (
                                    <div 
                                        key={key}
                                        className="absolute inset-0"
                                        style={{
                                            clipPath: `conic-gradient(from ${prevPercentages * 3.6}deg, transparent ${prevPercentages * 3.6}deg, ${colors[key]} ${prevPercentages * 3.6}deg, ${colors[key]} ${(prevPercentages + percentage) * 3.6}deg, transparent ${(prevPercentages + percentage) * 3.6}deg)`
                                        }}
                                    ></div>
                                );
                            })}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white w-32 h-32 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-semibold">Outcomes</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="ml-8">
                            {Object.entries(data.clinicalMetrics.treatmentOutcomes).map(([key, value]) => {
                                const total = Object.values(data.clinicalMetrics.treatmentOutcomes).reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                
                                // Colors for different outcomes
                                const colors = {
                                    excellent: '#10B981', // green
                                    good: '#3B82F6',      // blue
                                    fair: '#F59E0B',      // yellow
                                    poor: '#EF4444'       // red
                                };
                                
                                return (
                                    <div key={key} className="flex items-center mb-2">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[key] }}></div>
                                        <span className="capitalize">{key}: {percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard; 