import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from './ui/tabs';
import { 
  Loader2, 
  ClipboardList, 
  Check, 
  DollarSign, 
  CalendarIcon, 
  Tag, 
  FileText, 
  Filter 
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { billingService, TimeEntry, TimeEntrySummary, BillingPeriod } from '../services/billingService';
import { toast } from './ui/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

const InvoiceGenerator: React.FC = () => {
  const navigate = useNavigate();
  
  // State for clients and projects
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // State for invoice generation
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('last-month');
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceDate, setInvoiceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState<string>(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [groupEntriesBy, setGroupEntriesBy] = useState<'project' | 'task' | 'none'>('project');
  
  // State for time entries and summaries
  const [timeSummaries, setTimeSummaries] = useState<TimeEntrySummary[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Record<string, boolean>>({});
  const [allEntriesSelected, setAllEntriesSelected] = useState<boolean>(true);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'summary' | 'detailed'>('summary');
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState<boolean>(false);
  const [invoicePreview, setInvoicePreview] = useState<any>(null);
  
  // Fetch clients and projects on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsResponse = await fetch('/api/clients');
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
        
        const projectsResponse = await fetch('/api/projects');
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching clients and projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clients and projects',
          variant: 'destructive'
        });
      }
    };
    
    fetchData();
  }, []);
  
  // Filter projects when client is selected
  const filteredProjects = selectedClient
    ? projects.filter(project => project.clientId === selectedClient)
    : [];
  
  // Toggle project selection
  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };
  
  // Select all projects for the client
  const selectAllProjects = () => {
    setSelectedProjects(filteredProjects.map(project => project.id));
  };
  
  // Deselect all projects
  const deselectAllProjects = () => {
    setSelectedProjects([]);
  };
  
  // Calculate effective date range based on billing period
  const getDateRange = (): { startDate: Date, endDate: Date } => {
    const endDate = new Date();
    let startDate = new Date();
    
    if (billingPeriod === 'last-week') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (billingPeriod === 'last-month') {
      startDate.setMonth(endDate.getMonth() - 1);
    } else {
      // Custom period
      startDate = new Date(customStartDate);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate: new Date(customEndDate) };
    }
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };
  
  // Fetch time summaries for the selected client and projects
  const fetchTimeSummaries = async () => {
    if (!selectedClient) {
      toast({
        title: 'Client Required',
        description: 'Please select a client to generate an invoice',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { startDate, endDate } = getDateRange();
      
      const summaries = await billingService.getTimeSummariesForBilling(
        selectedClient,
        billingPeriod,
        startDate,
        endDate
      );
      
      // Filter summaries if specific projects are selected
      const filteredSummaries = selectedProjects.length > 0
        ? summaries.filter(summary => selectedProjects.includes(summary.projectId))
        : summaries;
      
      setTimeSummaries(filteredSummaries);
      
      // Reset entry selection state and select all by default
      const entrySelectionState: Record<string, boolean> = {};
      filteredSummaries.forEach(summary => {
        summary.unbilledEntries.forEach(entry => {
          entrySelectionState[entry.id] = true;
        });
      });
      
      setSelectedEntries(entrySelectionState);
      setAllEntriesSelected(true);
    } catch (error) {
      console.error('Error fetching time summaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load time entries',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle selection of a single time entry
  const toggleTimeEntry = (entryId: string) => {
    setSelectedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
    
    // Update allEntriesSelected state
    const updatedSelection = {
      ...selectedEntries,
      [entryId]: !selectedEntries[entryId]
    };
    
    const allSelected = Object.values(updatedSelection).every(Boolean);
    setAllEntriesSelected(allSelected);
  };
  
  // Toggle selection of all time entries
  const toggleAllTimeEntries = () => {
    const newState = !allEntriesSelected;
    
    const updatedSelection: Record<string, boolean> = {};
    timeSummaries.forEach(summary => {
      summary.unbilledEntries.forEach(entry => {
        updatedSelection[entry.id] = newState;
      });
    });
    
    setSelectedEntries(updatedSelection);
    setAllEntriesSelected(newState);
  };
  
  // Get all selected time entry IDs
  const getSelectedTimeEntryIds = (): string[] => {
    return Object.entries(selectedEntries)
      .filter(([_, isSelected]) => isSelected)
      .map(([entryId, _]) => entryId);
  };
  
  // Calculate total billable hours and amount
  const calculateTotals = () => {
    let totalHours = 0;
    let totalAmount = 0;
    
    timeSummaries.forEach(summary => {
      summary.unbilledEntries.forEach(entry => {
        if (selectedEntries[entry.id]) {
          // Convert duration from seconds to hours
          const hours = entry.duration / 3600;
          totalHours += hours;
          
          if (entry.billable && entry.billableRate) {
            totalAmount += hours * entry.billableRate;
          }
        }
      });
    });
    
    return { totalHours, totalAmount };
  };
  
  // Generate invoice
  const generateInvoice = async () => {
    const selectedEntryIds = getSelectedTimeEntryIds();
    
    if (selectedEntryIds.length === 0) {
      toast({
        title: 'No Entries Selected',
        description: 'Please select at least one time entry to include in the invoice',
        variant: 'destructive'
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Create a preview of the invoice
      const invoiceItems = billingService.createLineItemsFromTimeEntries(
        timeSummaries.flatMap(summary => 
          summary.unbilledEntries.filter(entry => selectedEntries[entry.id])
        ),
        groupEntriesBy
      );
      
      const { totalAmount } = calculateTotals();
      const invoiceNumber = await billingService.generateInvoiceNumber();
      
      const invoiceData = {
        clientId: selectedClient,
        projectIds: selectedProjects,
        number: invoiceNumber,
        date: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        subtotal: totalAmount,
        tax: 0, // Could add tax calculation
        total: totalAmount,
        status: 'draft',
        items: invoiceItems
      };
      
      setInvoicePreview(invoiceData);
      setIsInvoicePreviewOpen(true);
    } catch (error) {
      console.error('Error generating invoice preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice preview',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Save invoice and mark time entries as invoiced
  const saveInvoice = async () => {
    if (!invoicePreview) return;
    
    setIsGenerating(true);
    
    try {
      // Generate the actual invoice
      const invoice = await billingService.generateInvoiceFromTimeEntries(
        selectedClient,
        selectedProjects,
        getSelectedTimeEntryIds(),
        new Date(invoiceDate),
        new Date(dueDate)
      );
      
      // Mark time entries as invoiced
      await billingService.markTimeEntriesAsInvoiced(
        getSelectedTimeEntryIds(),
        invoice.id
      );
      
      toast({
        title: 'Invoice Generated',
        description: `Invoice #${invoice.number} has been created successfully`,
      });
      
      // Close the dialog and navigate to the invoice
      setIsInvoicePreviewOpen(false);
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format hours
  const formatHours = (seconds: number): string => {
    const hours = seconds / 3600;
    return hours.toFixed(2);
  };
  
  // Get client name
  const getClientName = (clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  // Get project name
  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };
  
  // Render project selection
  const renderProjectSelection = () => {
    if (filteredProjects.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No projects found for the selected client.
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Select Projects</span>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={selectAllProjects}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllProjects}>
              Deselect All
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
          {filteredProjects.map(project => (
            <div key={project.id} className="flex items-center space-x-2">
              <Checkbox
                id={`project-${project.id}`}
                checked={selectedProjects.includes(project.id)}
                onCheckedChange={() => toggleProject(project.id)}
              />
              <Label htmlFor={`project-${project.id}`} className="cursor-pointer">
                {project.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render time entry summaries
  const renderTimeSummaries = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (timeSummaries.length === 0) {
      return (
        <div className="text-center py-8 space-y-2">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <p>No billable time entries found for the selected period.</p>
          <p className="text-sm text-muted-foreground">
            Try selecting a different date range or check if there are unbilled entries.
          </p>
        </div>
      );
    }
    
    const { totalHours, totalAmount } = calculateTotals();
    
    return (
      <>
        <Tabs value={previewMode} onValueChange={(value: string) => setPreviewMode(value as 'summary' | 'detailed')}>
          <TabsList>
            <TabsTrigger value="summary">Summary View</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Billable Hours</TableHead>
                  <TableHead>Billable Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSummaries.map(summary => {
                  // Calculate project totals from selected entries only
                  let projectHours = 0;
                  let projectAmount = 0;
                  
                  summary.unbilledEntries.forEach(entry => {
                    if (selectedEntries[entry.id]) {
                      const hours = entry.duration / 3600;
                      projectHours += hours;
                      
                      if (entry.billable && entry.billableRate) {
                        projectAmount += hours * entry.billableRate;
                      }
                    }
                  });
                  
                  return (
                    <TableRow key={summary.projectId}>
                      <TableCell className="font-medium">{summary.projectName}</TableCell>
                      <TableCell>{projectHours.toFixed(2)}</TableCell>
                      <TableCell>{formatCurrency(projectAmount)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="font-bold">{totalHours.toFixed(2)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(totalAmount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="detailed" className="pt-4">
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={allEntriesSelected}
                  onCheckedChange={toggleAllTimeEntries}
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  Select All Time Entries
                </Label>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSummaries.flatMap(summary => 
                    summary.unbilledEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEntries[entry.id] || false}
                            onCheckedChange={() => toggleTimeEntry(entry.id)}
                          />
                        </TableCell>
                        <TableCell>{format(new Date(entry.startTime), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{summary.projectName}</TableCell>
                        <TableCell>{entry.description || 'No description'}</TableCell>
                        <TableCell>{formatHours(entry.duration)}</TableCell>
                        <TableCell>{entry.billableRate ? formatCurrency(entry.billableRate) : 'N/A'}</TableCell>
                        <TableCell>
                          {entry.billableRate 
                            ? formatCurrency((entry.duration / 3600) * entry.billableRate) 
                            : formatCurrency(0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Total Hours:</span>
                  <span className="font-medium">{totalHours.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Invoice from Time Entries</CardTitle>
          <CardDescription>
            Create an invoice based on billable time entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client and Project Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedClient && renderProjectSelection()}
            </div>
            
            {/* Billing Period and Invoice Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="billingPeriod">Billing Period</Label>
                <Select value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as BillingPeriod)}>
                  <SelectTrigger id="billingPeriod">
                    <SelectValue placeholder="Select billing period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-week">Last Week</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {billingPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="endDate"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="groupBy">Group Time Entries By</Label>
                <Select 
                  value={groupEntriesBy} 
                  onValueChange={(value) => setGroupEntriesBy(value as 'project' | 'task' | 'none')}
                >
                  <SelectTrigger id="groupBy">
                    <SelectValue placeholder="Select grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="none">Individual Entries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={fetchTimeSummaries} 
                disabled={!selectedClient}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardList className="mr-2 h-4 w-4" />
                )}
                Load Time Summaries
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={generateInvoice} 
            disabled={isGenerating || !selectedClient || selectedProjects.length === 0}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DollarSign className="mr-2 h-4 w-4" />
            )}
            Generate Invoice
          </Button>
        </CardFooter>
      </Card>
      
      {/* Invoice Preview Dialog */}
      <Dialog open={isInvoicePreviewOpen} onOpenChange={setIsInvoicePreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Review the invoice details before saving.
            </DialogDescription>
          </DialogHeader>
          
          {invoicePreview && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Invoice Number:</span>
                <span>{invoicePreview.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Client:</span>
                <span>{getClientName(invoicePreview.clientId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{format(new Date(invoicePreview.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Due Date:</span>
                <span>{format(new Date(invoicePreview.dueDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span>{formatCurrency(invoicePreview.total)}</span>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end">
            <Button onClick={saveInvoice} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceGenerator; 