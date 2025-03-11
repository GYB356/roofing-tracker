import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from './ui/tabs';
import { 
  Clock, 
  ClipboardList, 
  BarChart2, 
  Settings 
} from 'lucide-react';
import Timer from './Timer';
import TimeEntriesList from './TimeEntriesList';
import TimeSummary from './TimeSummary';
import TimeTrackingSettings from './TimeTrackingSettings';

const TimeTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tracker');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  
  // Handle timer start/stop to reflect in other components
  const handleTimerChange = (isRunning: boolean, timeEntry?: any) => {
    // If timer starts, update selected project/task for consistency
       if (isRunning && timeEntry) {
      setSelectedProjectId(timeEntry.projectId);
      setSelectedTaskId(timeEntry.taskId);
    }
    
    // Optionally refresh the time entries list when timer stops
    if (!isRunning) {
      // Could trigger a refresh of the TimeEntriesList component here
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Time Tracking</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="tracker">
            <Clock className="h-4 w-4 mr-2" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="entries">
            <ClipboardList className="h-4 w-4 mr-2" />
            Entries
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart2 className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="tracker" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Timer 
                  onTimerChange={handleTimerChange}
                  preSelectedProjectId={selectedProjectId}
                  preSelectedTaskId={selectedTaskId}
                />
              </div>
              <div>
                {/* Recent time entries for quick access */}
                <TimeEntriesList
                  projectId={selectedProjectId}
                  taskId={selectedTaskId}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="entries">
            <TimeEntriesList />
          </TabsContent>
          
          <TabsContent value="reports">
            <TimeSummary />
          </TabsContent>
          
          <TabsContent value="settings">
            <TimeTrackingSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TimeTrackingPage; 