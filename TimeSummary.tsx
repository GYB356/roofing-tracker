import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart2, 
  PieChart, 
  Calendar, 
  DollarSign, 
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Pie, Cell, Legend } from 'recharts';

// Mock data for demonstration
const mockTimeData = {
  dailySummary: [
    { date: 'Mon', billable: 4.5, nonBillable: 1.2 },
    { date: 'Tue', billable: 6.2, nonBillable: 0.5 },
    { date: 'Wed', billable: 5.7, nonBillable: 1.8 },
    { date: 'Thu', billable: 7.1, nonBillable: 0.3 },
    { date: 'Fri', billable: 4.9, nonBillable: 0.7 },
    { date: 'Sat', billable: 1.2, nonBillable: 0 },
    { date: 'Sun', billable: 0, nonBillable: 0 }
  ],
  projectSummary: [
    { name: 'Website Redesign', hours: 14.3, billable: 13.1, nonBillable: 1.2 },
    { name: 'Mobile App Dev', hours: 10.2, billable: 9.7, nonBillable: 0.5 },
    { name: 'CRM Integration', hours: 6.1, billable: 4.8, nonBillable: 1.3 }
  ],
  taskSummary: [
    { name: 'Development', hours: 18.5 },
    { name: 'Design', hours: 7.2 },
    { name: 'Meetings', hours: 3.4 },
    { name: 'Documentation', hours: 1.5 }
  ]
};

const TimeSummary = () => {
  const [periodFilter, setPeriodFilter] = useState('week');
  const [activeView, setActiveView] = useState('daily');
  const [totalHours, setTotalHours] = useState(0);
  const [billableHours, setBillableHours] = useState(0);
  const [billableAmount, setBillableAmount] = useState(0);
  
  // Calculate totals
  useEffect(() => {
    let total = 0;
    let billable = 0;
    
    mockTimeData.dailySummary.forEach(day => {
      total += day.billable + day.nonBillable;
      billable += day.billable;
    });
    
    setTotalHours(total);
    setBillableHours(billable);
    setBillableAmount(billable * 100); // Assuming $100/hour rate
  }, []);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const BILLABLE_COLOR = '#4CAF50';
  const NON_BILLABLE_COLOR = '#F44336';

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Time Summary</CardTitle>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Hours</p>
                    <h3 className="text-2xl font-bold">{totalHours.toFixed(1)}h</h3>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Billable Hours</p>
                    <h3 className="text-2xl font-bold">{billableHours.toFixed(1)}h</h3>
                    <p className="text-xs text-gray-500">{((billableHours / totalHours) * 100).toFixed(0)}% of total</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Billable Amount</p>
                    <h3 className="text-2xl font-bold">${billableAmount.toFixed(2)}</h3>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Chart Tabs */}
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="mb-6">
              <TabsTrigger value="daily">
                <Calendar className="mr-2 h-4 w-4" />
                Daily Breakdown
              </TabsTrigger>
              <TabsTrigger value="projects">
                <BarChart2 className="mr-2 h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <PieChart className="mr-2 h-4 w-4" />
                Tasks
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mockTimeData.dailySummary}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value} hours`, '']} />
                    <Legend />
                    <Bar dataKey="billable" stackId="a" name="Billable" fill={BILLABLE_COLOR} />
                    <Bar dataKey="nonBillable" stackId="a" name="Non-Billable" fill={NON_BILLABLE_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="projects">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mockTimeData.projectSummary}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: 'Hours', position: 'insideBottom', offset: -5 }} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value} hours`, '']} />
                    <Legend />
                    <Bar dataKey="billable" stackId="a" name="Billable" fill={BILLABLE_COLOR} />
                    <Bar dataKey="nonBillable" stackId="a" name="Non-Billable" fill={NON_BILLABLE_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="tasks">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mockTimeData.taskSummary}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value} hours`, '']} />
                    <Bar dataKey="hours" fill="#8884d8">
                      {mockTimeData.taskSummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSummary; 