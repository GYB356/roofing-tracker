import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parse, startOfDay } from 'date-fns';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
  SelectValue,
} from './ui/select';
import { 
  Calendar, 
  Tag, 
  DollarSign,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from './ui/use-toast';

interface TimeEntryFormProps {
  onSuccess?: (timeEntry: any) => void;
  timeEntryToEdit?: any;
  taskId?: string;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  projectId: string;
}

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({ 
  onSuccess, 
  timeEntryToEdit,
  taskId: initialTaskId,
  projectId: initialProjectId
}) => {
  // Form state
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [tags, setTags] = useState('');
  
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch projects and tasks on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch projects
        const projectsResponse = await axios.get('/api/projects');
        setProjects(projectsResponse.data);
        
        // Fetch tasks
        const tasksResponse = await axios.get('/api/tasks');
        setTasks(tasksResponse.data);
        
        // Set initial values if editing or if initial IDs are provided
        if (timeEntryToEdit) {
          // Populate form with timeEntryToEdit data
          setDescription(timeEntryToEdit.description || '');
          setSelectedProject(timeEntryToEdit.projectId || '');
          setSelectedTask(timeEntryToEdit.taskId || '');
          setStartDate(format(new Date(timeEntryToEdit.startTime), 'yyyy-MM-dd'));
          setStartTime(format(new Date(timeEntryToEdit.startTime), 'HH:mm'));
          setEndDate(format(new Date(timeEntryToEdit.endTime), 'yyyy-MM-dd'));
          setEndTime(format(new Date(timeEntryToEdit.endTime), 'HH:mm'));
          setIsBillable(timeEntryToEdit.billable);
          setTags(timeEntryToEdit.tags.join(', '));
        } else {
          // Set today's date as default
          const today = new Date();
          setStartDate(format(today, 'yyyy-MM-dd'));
          setEndDate(format(today, 'yyyy-MM-dd'));
          
          // Set default time (now for start, now + 1 hour for end)
          const now = new Date();
          setStartTime(format(now, 'HH:mm'));
          
          const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
          setEndTime(format(oneHourLater, 'HH:mm'));
          
          // Set initial project and task if provided
          if (initialProjectId) {
            setSelectedProject(initialProjectId);
          }
          
          if (initialTaskId) {
            setSelectedTask(initialTaskId);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects and tasks',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timeEntryToEdit, initialTaskId, initialProjectId]);
  
  // Filter tasks when project is selected
  useEffect(() => {
    if (selectedProject) {
      const filtered = tasks.filter(task => task.projectId === selectedProject);
      setFilteredTasks(filtered);
      
      // Clear task selection if the current task doesn't belong to the selected project
      if (selectedTask && !filtered.find(t => t.id === selectedTask)) {
        setSelectedTask('');
      }
    } else {
      setFilteredTasks([]);
      setSelectedTask('');
    }
  }, [selectedProject, tasks, selectedTask]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !selectedTask || !startDate || !startTime || !endDate || !endTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    // Construct start and end datetime objects
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    // Validate end time is after start time
    if (endDateTime <= startDateTime) {
      toast({
        title: 'Validation Error',
        description: 'End time must be after start time',
        variant: 'destructive'
      });
      return;
    }
    
    // Prepare form data
    const formData = {
      taskId: selectedTask,
      projectId: selectedProject,
      description,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      billable: isBillable,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    };
    
    setIsSaving(true);
    
    try {
      let response;
      
      if (timeEntryToEdit) {
        // Update existing time entry
        response = await axios.put(`/api/time/entries/${timeEntryToEdit.id}`, formData);
        toast({
          title: 'Success',
          description: 'Time entry updated successfully'
        });
      } else {
        // Create new time entry
        response = await axios.post('/api/time/entries', formData);
        toast({
          title: 'Success',
          description: 'Time entry created successfully'
        });
        
        // Reset form for new entry
        setDescription('');
        // Keep the project and task selections for convenience
        
        // Reset dates to today
        const today = new Date();
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        
        // Reset times
        setStartTime(format(today, 'HH:mm'));
        const oneHourLater = new Date(today.getTime() + 60 * 60 * 1000);
        setEndTime(format(oneHourLater, 'HH:mm'));
        
        setTags('');
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save time entry',
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
        <CardTitle>
          {timeEntryToEdit ? 'Edit Time Entry' : 'Log Time Manually'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select 
                value={selectedProject} 
                onValueChange={setSelectedProject}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task">Task *</Label>
              <Select 
                value={selectedTask} 
                onValueChange={setSelectedTask}
                disabled={filteredTasks.length === 0}
              >
                <SelectTrigger id="task">
                  <SelectValue placeholder={
                    selectedProject ? "Select a task" : "Select a project first"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="billable" 
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(checked as boolean)}
            />
            <Label htmlFor="billable" className="cursor-pointer">
              <DollarSign className="inline-block h-4 w-4 mr-1" />
              Billable
            </Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <div className="flex items-center">
              <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. design, meeting, research"
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => {
          if (onSuccess) onSuccess(null);
        }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {timeEntryToEdit ? 'Update' : 'Save'} Time Entry
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TimeEntryForm; 