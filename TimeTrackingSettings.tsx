import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { 
  Select, 
  SelectContent, 
 SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Switch 
} from './ui/switch';
import { 
  Loader2, 
  Clock, 
  DollarSign, 
  BellRing, 
  Calendar 
} from 'lucide-react';
import { toast } from './ui/use-toast';

interface WorkingHours {
  [key: string]: {
    start: string;
    end: string;
    isWorkDay: boolean;
  };
}

interface TimeTrackingSettingsData {
  userId: string;
  defaultBillableRate: number;
  roundingInterval: number;
  autoStopTimerAfterInactivity: number;
  reminderInterval: number;
  workingHours: WorkingHours;
}

const TimeTrackingSettings: React.FC = () => {
  // Form state
  const [defaultBillableRate, setDefaultBillableRate] = useState<number>(0);
  const [roundingInterval, setRoundingInterval] = useState<number>(15);
  const [autoStopTimer, setAutoStopTimer] = useState<number>(30);
  const [reminderInterval, setReminderInterval] = useState<number>(0);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    '0': { start: '09:00', end: '17:00', isWorkDay: false }, // Sunday
    '1': { start: '09:00', end: '17:00', isWorkDay: true }, // Monday
    '2': { start: '09:00', end: '17:00', isWorkDay: true }, // Tuesday
    '3': { start: '09:00', end: '17:00', isWorkDay: true }, // Wednesday
    '4': { start: '09:00', end: '17:00', isWorkDay: true }, // Thursday
    '5': { start: '09:00', end: '17:00', isWorkDay: true }, // Friday
    '6': { start: '09:00', end: '17:00', isWorkDay: false } // Saturday
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notificationsPermission, setNotificationsPermission] = useState<string>('default');
  
  // Day names for display
  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  
  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      
      try {
        const response = await axios.get('/api/time/settings');
        const settings = response.data;
        
        // Update state with fetched settings
        setDefaultBillableRate(settings.defaultBillableRate);
        setRoundingInterval(settings.roundingInterval);
        setAutoStopTimer(settings.autoStopTimerAfterInactivity);
        setReminderInterval(settings.reminderInterval);
        
        // Only update working hours if data exists
        if (settings.workingHours) {
          setWorkingHours(settings.workingHours);
        }
      } catch (error) {
        console.error('Error fetching time tracking settings:', error);
        toast({
          title: 'Failed to load settings',
          description: 'Please try again later',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationsPermission(Notification.permission);
    }
  }, []);
  
  // Update working hours for a specific day
  const updateWorkingHours = (
    dayIndex: string,
    field: 'start' | 'end' | 'isWorkDay',
    value: string | boolean
  ) => {
    setWorkingHours(prevHours => ({
      ...prevHours,
      [dayIndex]: {
        ...prevHours[dayIndex],
        [field]: value
      }
    }));
  };
  
  // Request notifications permission
  const requestNotificationsPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive timer reminders'
        });
      } else {
        toast({
          title: 'Notifications Disabled',
          description: 'Timer reminders won\'t appear as notifications',
          variant: 'destructive'
        });
      }
    }
  };
  
  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      const settingsData: TimeTrackingSettingsData = {
        userId: '', // Will be set by server based on authentication
        defaultBillableRate,
        roundingInterval,
        autoStopTimerAfterInactivity: autoStopTimer,
        reminderInterval,
        workingHours
      };
      
      await axios.put('/api/time/settings', settingsData);
      
      toast({
        title: 'Settings Saved',
        description: 'Your time tracking settings have been updated'
      });
    } catch (error) {
      console.error('Error saving time tracking settings:', error);
      toast({
        title: 'Failed to save settings',
        description: 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking Settings</CardTitle>
        <CardDescription>
          Configure your time tracking preferences and working hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-4">General Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultRate">Default Billable Rate ($/hour)</Label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    id="defaultRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={defaultBillableRate}
                    onChange={(e) => setDefaultBillableRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roundingInterval">Round time entries to (minutes)</Label>
                <Select
                  value={roundingInterval.toString()}
                  onValueChange={(value) => setRoundingInterval(parseInt(value))}
                >
                  <SelectTrigger id="roundingInterval">
                    <SelectValue placeholder="Select rounding interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Don't round</SelectItem>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Timer Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="autoStopTimer">Auto-stop timer after inactivity</Label>
                <Select
                  value={autoStopTimer.toString()}
                  onValueChange={(value) => setAutoStopTimer(parseInt(value))}
                >
                  <SelectTrigger id="autoStopTimer">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Never</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminderInterval">Timer reminder interval</Label>
                <div className="flex items-center space-x-4">
                  <Select
                    value={reminderInterval.toString()}
                    onValueChange={(value) => setReminderInterval(parseInt(value))}
                  >
                    <SelectTrigger id="reminderInterval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Disabled</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {reminderInterval > 0 && notificationsPermission !== 'granted' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={requestNotificationsPermission}
                    >
                      <BellRing className="h-4 w-4 mr-2" />
                      Enable Notifications
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Working Hours</h3>
            
            <div className="space-y-2">
              {dayNames.map((dayName, index) => (
                <div key={index} className="flex items-center space-x-4 p-2 rounded-md hover:bg-muted">
                  <div className="w-24">
                    <span>{dayName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`workday-${index}`}
                      checked={workingHours[index.toString()].isWorkDay}
                      onCheckedChange={(checked) => 
                        updateWorkingHours(index.toString(), 'isWorkDay', checked)
                      }
                    />
                    <Label htmlFor={`workday-${index}`}>Work day</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={workingHours[index.toString()].start}
                      onChange={(e) => 
                        updateWorkingHours(index.toString(), 'start', e.target.value)
                      }
                      disabled={!workingHours[index.toString()].isWorkDay}
                      className="w-24"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={workingHours[index.toString()].end}
                      onChange={(e) => 
                        updateWorkingHours(index.toString(), 'end', e.target.value)
                      }
                      disabled={!workingHours[index.toString()].isWorkDay}
                      className="w-24"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TimeTrackingSettings; 