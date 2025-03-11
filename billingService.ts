import axios from 'axios';

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  description: string;
  startTime: Date | string;
  endTime: Date | string;
  duration: number;
  billable: boolean;
  invoiceId: string | null;
  billableRate: number | null;
  tags: string[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number; // In hours
  rate: number;
  amount: number;
  timeEntryIds: string[];
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId?: string;
  number: string;
  date: Date | string;
  dueDate: Date | string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
}

export type BillingPeriod = 'last-week' | 'last-month' | 'custom';

export interface TimeEntrySummary {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  entries: TimeEntry[];
  totalHours: number;
  billableHours: number;
  billableAmount: number;
  unbilledEntries: TimeEntry[];
}

class BillingService {
  // Get time entries eligible for billing
  public async getBillableTimeEntries(
    clientId: string,
    projectId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeEntry[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('clientId', clientId);
      if (projectId) params.append('projectId', projectId);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      params.append('billable', 'true');
      params.append('invoiced', 'false'); // Only get unbilled entries
      
      const response = await axios.get(`/api/time/entries/billable?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching billable time entries:', error);
      throw error;
    }
  }
  
  // Get time entry summaries for billing
  public async getTimeSummariesForBilling(
    clientId: string,
    period: BillingPeriod,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeEntrySummary[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('clientId', clientId);
      params.append('period', period);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await axios.get(`/api/billing/time-summaries?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching time summaries for billing:', error);
      throw error;
    }
  }
  
  // Generate a draft invoice from time entries
  public async generateInvoiceFromTimeEntries(
    clientId: string,
    projectIds: string[],
    timeEntryIds: string[],
    invoiceDate: Date = new Date(),
    dueDate?: Date
  ): Promise<Invoice> {
    try {
      // If dueDate not provided, set to 30 days from invoice date
      if (!dueDate) {
        dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);
      }
      
      const response = await axios.post('/api/billing/invoices/generate', {
        clientId,
        projectIds,
        timeEntryIds,
        invoiceDate: invoiceDate.toISOString(),
        dueDate: dueDate.toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating invoice from time entries:', error);
      throw error;
    }
  }
  
  // Update time entries with invoice ID after invoicing
  public async markTimeEntriesAsInvoiced(
    timeEntryIds: string[],
    invoiceId: string
  ): Promise<void> {
    try {
      await axios.post('/api/time/entries/mark-invoiced', {
        timeEntryIds,
        invoiceId
      });
    } catch (error) {
      console.error('Error marking time entries as invoiced:', error);
      throw error;
    }
  }
  
  // Get invoices with time entry details
  public async getInvoicesWithTimeEntries(
    clientId?: string,
    status?: string
  ): Promise<Invoice[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (clientId) params.append('clientId', clientId);
      if (status) params.append('status', status);
      params.append('includeTimeEntries', 'true');
      
      const response = await axios.get(`/api/billing/invoices?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices with time entries:', error);
      throw error;
    }
  }
  
  // Generate a new invoice number
  public async generateInvoiceNumber(): Promise<string> {
    try {
      const response = await axios.get('/api/billing/invoices/generate-number');
      return response.data.invoiceNumber;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }
  
  // Get time entry billable rates
  public async getBillableRates(
    userId?: string,
    projectId?: string,
    taskTypeId?: string
  ): Promise<any[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (projectId) params.append('projectId', projectId);
      if (taskTypeId) params.append('taskTypeId', taskTypeId);
      
      const response = await axios.get(`/api/time/rates?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching billable rates:', error);
      throw error;
    }
  }
  
  // Calculate billable amount for time entries
  public calculateBillableAmount(timeEntries: TimeEntry[]): number {
    return timeEntries.reduce((total, entry) => {
      if (entry.billable && entry.billableRate) {
        // Convert duration from seconds to hours
        const hours = entry.duration / 3600;
        return total + (hours * entry.billableRate);
      }
      return total;
    }, 0);
  }
  
  // Format hours for display
  public formatHours(seconds: number): string {
    const hours = seconds / 3600;
    return hours.toFixed(2);
  }
  
  // Group time entries by project
  public groupTimeEntriesByProject(timeEntries: TimeEntry[]): Record<string, TimeEntry[]> {
    return timeEntries.reduce((groups, entry) => {
      if (!groups[entry.projectId]) {
        groups[entry.projectId] = [];
      }
      groups[entry.projectId].push(entry);
      return groups;
    }, {} as Record<string, TimeEntry[]>);
  }
  
  // Group time entries by task
  public groupTimeEntriesByTask(timeEntries: TimeEntry[]): Record<string, TimeEntry[]> {
    return timeEntries.reduce((groups, entry) => {
      if (!groups[entry.taskId]) {
        groups[entry.taskId] = [];
      }
      groups[entry.taskId].push(entry);
      return groups;
    }, {} as Record<string, TimeEntry[]>);
  }
  
  // Create invoice line items from time entries grouped by project
  public createLineItemsFromTimeEntries(
    timeEntries: TimeEntry[],
    groupBy: 'project' | 'task' | 'none' = 'project'
  ): InvoiceItem[] {
    const lineItems: InvoiceItem[] = [];
    
    if (groupBy === 'none') {
      // Each time entry becomes its own line item
      timeEntries.forEach(entry => {
        if (entry.billable && entry.billableRate) {
          const hours = entry.duration / 3600;
          lineItems.push({
            id: '', // Will be assigned by the server
            description: entry.description || 'Time entry',
            quantity: hours,
            rate: entry.billableRate,
            amount: hours * entry.billableRate,
            timeEntryIds: [entry.id]
          });
        }
      });
    } else {
      // Group entries by project or task
      const grouped = groupBy === 'project' 
        ? this.groupTimeEntriesByProject(timeEntries)
        : this.groupTimeEntriesByTask(timeEntries);
      
      // Process each group
      Object.entries(grouped).forEach(([groupId, entries]) => {
        // Calculate total hours and amount
        let totalHours = 0;
        let totalAmount = 0;
        const entryIds: string[] = [];
        
        entries.forEach(entry => {
          if (entry.billable) {
            const hours = entry.duration / 3600;
            totalHours += hours;
            
            if (entry.billableRate) {
              totalAmount += hours * entry.billableRate;
            }
            
            entryIds.push(entry.id);
          }
        });
        
        // Only create line item if there are billable hours
        if (totalHours > 0) {
          // Calculate average rate
          const avgRate = totalAmount / totalHours;
          
          // Create line item
          lineItems.push({
            id: '', // Will be assigned by the server
            description: groupBy === 'project' ? `Project work: ${groupId}` : `Task work: ${groupId}`,
            quantity: totalHours,
            rate: avgRate,
            amount: totalAmount,
            timeEntryIds: entryIds
          });
        }
      });
    }
    
    return lineItems;
  }
  
  // Unlink time entries from an invoice
  public async unlinkTimeEntriesFromInvoice(invoiceId: string): Promise<void> {
    try {
      await axios.post('/api/time/entries/unlink-invoice', { invoiceId });
    } catch (error) {
      console.error('Error unlinking time entries from invoice:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const billingService = new BillingService(); 