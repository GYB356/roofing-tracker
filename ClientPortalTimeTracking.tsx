import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, isThisWeek, isThisMonth } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from './ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from './ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from './ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from './ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Loader2,
  Calendar,
  FileText,
  Clock,
  Filter,
  DollarSign,
  Hourglass,
  BarChart2,
  ListFilter
} from 'lucide-react';
import { toast } from './ui/use-toast';

interface ClientPortalTimeTrackingProps {
  clientId: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  billable: boolean;
  tags: string[];
}

interface TimeEntrySummary {
  projectId: string;
  projectName: string;
  date: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
}

interface User {
  id: string;
  name: string;
}

const ClientPortalTimeTracking: React.FC<ClientPortalTimeTrackingProps> = ({ clientId }) => {
  // State for data
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [dailySummaries, setDailySummaries] = useState<TimeEntrySummary[]>([]);
  const [projectSummaries, setProjectSummaries] = useState<TimeEntrySummary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // State for filters
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('this-week');
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('summary');
  
  // Load projects when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`/api/client-portal/projects?clientId=${clientId}`);
        setProjects(response.data);
        
        // Select the first project by default if available
        if (response.data.length > 0) {
          setSelectedProject(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects',
          variant: 'destructive'
        });
      }
    };
    
    fetchProjects();
    
    // Also fetch team members
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`/api/client-portal/team-members?clientId=${clientId}`);
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };
    
    fetchUsers();
  }, [clientId]);
  
  // Load time entries whenever filters change
  useEffect(() => {
    const fetchTimeData = async () => {
      if (!selectedProject && projects.length === 0) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Calculate date range
        let startDate, endDate;
        
        if (dateRange === 'custom') {
          startDate = customStartDate;
          endDate = customEndDate;
        } else {
          const now = new Date();
          endDate = format(now, 'yyyy-MM-dd');
          
          if (dateRange === 'this-week') {
            // Start of current week
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
            startDate = format(new Date(now.setDate(diff)), 'yyyy-MM-dd');
          } else if (dateRange === 'this-month') {
            // Start of current month
            startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
          } else if (dateRange === 'last-month') {
            // Start of last month
            startDate = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM-dd');
            endDate = format(new Date(now.getFullYear(), now.getMonth(), 0), 'yyyy-MM-dd');
          } else {
            // Last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
          }
        }
        
        // Build query params
        const params = new URLSearchParams();
        params.append('clientId', clientId);
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        
        if (selectedProject) {
          params.append('projectId', selectedProject);
        }
        
        // Get detailed time entries
        const entriesResponse = await axios.get(`/api/client-portal/time-entries?${params.toString()}`);
        setTimeEntries(entriesResponse.data);
        
        // Get daily summaries for the chart
        const dailySummaryResponse = await axios.get(
          `/api/client-portal/time-summary/daily?${params.toString()}`
        );
        setDailySummaries(dailySummaryResponse.data);
        
        // Get project summaries
        const projectSummaryResponse = await axios.get(
          `/api/client-portal/time-summary/project?${params.toString()}`
        );
        setProjectSummaries(projectSummaryResponse.data);
      } catch (error) {
        console.error('Error fetching time data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load time tracking data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTimeData();
  }, [clientId, selectedProject, dateRange, customStartDate, customEndDate, projects]);
  
  // Format time in readable format
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  };
  
  // Get user name
  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };
  
  // Get project name
  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };
  
  // Calculate totals
  const calculateTotals = () => {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration / 3600, 0);
    const billableHours = timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + entry.duration / 3600, 0);
    const nonBillableHours = totalHours - billableHours;
    
    return {
      totalHours,
      billableHours,
      nonBillableHours,
      billablePercentage: totalHours > 0 ? (billableHours / totalHours) * 100 : 0
    };
  };
  
  // Render summary tab
  const renderSummary = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (timeEntries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No time entries for this period</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your filters or selecting a different project
          </p>
        </div>
      );
    }
    
    const { totalHours, billableHours, nonBillableHours, billablePercentage } = calculateTotals();
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <h3 className="text-2xl font-bold">{totalHours.toFixed(2)}h</h3>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Billable Hours</p>
                  <h3 className="text-2xl font-bold">{billableHours.toFixed(2)}h</h3>
                  <p className="text-xs text-muted-foreground">{billablePercentage.toFixed(0)}% of total</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Non-Billable Hours</p>
                  <h3 className="text-2xl font-bold">{nonBillableHours.toFixed(2)}h</h3>
                  <p className="text-xs text-muted-foreground">
                    {(100 - billablePercentage).toFixed(0)}% of total
                  </p>
                </div>
                <Hourglass className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Time Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailySummaries}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      // Format date to show only day and month
                      const date = parseISO(value);
                      return format(date, 'MMM d');
                    }}
                  />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${parseFloat(value).toFixed(2)} hours`, 
                      name === 'billableHours' ? 'Billable' : 'Non-Billable'
                    ]}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend />
                  <Bar dataKey="billableHours" name="Billable" fill="#4CAF50" />
                  <Bar dataKey="nonBillableHours" name="Non-Billable" fill="#FF9800" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Project Breakdown */}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Billable Hours</TableHead>
                  <TableHead className="text-right">Billable %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectSummaries.map((summary) => {
                  const billablePercentage = summary.totalHours > 0
                    ? (summary.billableHours / summary.totalHours) * 100
                    : 0;
                  
                  return (
                    <TableRow key={summary.projectId}>
                      <TableCell className="font-medium">{summary.projectName}</TableCell>
                      <TableCell className="text-right">{summary.totalHours.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{summary.billableHours.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{billablePercentage.toFixed(0)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render details tab
  const renderDetails = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (timeEntries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No time entries for this period</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your filters or selecting a different project
          </p>
        </div>
      );
    }
    
    // Sort time entries by date (newest first)
    const sortedEntries = [...timeEntries].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    // Group entries by date
    const entriesByDate: { [key: string]: TimeEntry[] } = {};
    
    sortedEntries.forEach(entry => {
      const dateKey = format(parseISO(entry.startTime), 'yyyy-MM-dd');
      
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = [];
      }
      
      entriesByDate[dateKey].push(entry);
    });
    
    return (
      <div className="space-y-6">
        {Object.entries(entriesByDate).map(([dateKey, entries]) => {
          const date = parseISO(dateKey);
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
          const isYesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') === dateKey;
          
          let dateDisplay = format(date, 'EEEE, MMMM d, yyyy');
          if (isToday) {
            dateDisplay = `Today - ${format(date, 'MMMM d, yyyy')}`;
          } else if (isYesterday) {
            dateDisplay = `Yesterday - ${format(date, 'MMMM d, yyyy')}`;
          }
          
          // Calculate total for the day
          const dailyTotal = entries.reduce((sum, entry) => sum + entry.duration, 0);
          
          return (
            <div key={dateKey}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">{dateDisplay}</h3>
                <div className="text-sm text-muted-foreground">
                  Total: {formatTime(dailyTotal)}
                </div>
              </div>
              
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Billable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(entry => {
                      const startTimeFormatted = format(parseISO(entry.startTime), 'h:mm a');
                      const endTimeFormatted = entry.endTime 
                        ? format(parseISO(entry.endTime), 'h:mm a')
                        : 'In progress';
                      
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {startTimeFormatted} - {endTimeFormatted}
                          </TableCell>
                          <TableCell>{entry.description || 'No description'}</TableCell>
                          <TableCell>{getProjectName(entry.projectId)}</TableCell>
                          <TableCell>{getUserName(entry.userId)}</TableCell>
                          <TableCell className="text-right">{formatTime(entry.duration)}</TableCell>
                          <TableCell>
                            {entry.billable ? (
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                <span className="ml-1">Yes</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold">Time Tracking</h2>
        
        <div className="flex flex-col md:flex-row gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {dateRange === 'custom' && (
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">
            <BarChart2 className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="details">
            <ListFilter className="h-4 w-4 mr-2" />
            Detailed View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-6">
          {renderSummary()}
        </TabsContent>
        
        <TabsContent value="details" className="mt-6">
          {renderDetails()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientPortalTimeTracking; 