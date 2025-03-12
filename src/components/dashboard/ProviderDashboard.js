import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import providerService from '../../services/ProviderService.js';
import { 
  Calendar, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Activity,
  Users,
  User,
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronRight,
  Shield,
  Sun,
  Moon,
  LogOut,
  Settings,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Function to determine notification color based on type
const getNotificationColor = (type) => {
  switch (type) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'appointment':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    case 'message':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'info':
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
  }
};

// Function to determine notification icon based on type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'urgent':
      return <AlertTriangle size={16} />;
    case 'warning':
      return <AlertCircle size={16} />;
    case 'success':
      return <CheckCircle size={16} />;
    case 'appointment':
      return <Calendar size={16} />;
    case 'message':
      return <MessageSquare size={16} />;
    case 'info':
    default:
      return <Bell size={16} />;
  }
};

const ProviderDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await providerService.getProjects();
        setProjects(response.data || []);
      } catch (err) {
        setError('Failed to load projects: ' + (err.response?.data?.message || err.message));
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle loading state with a better UI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Handle error state with a better UI
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Provider Dashboard</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No projects found.</p>
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate('/projects/new')}
            >
              Create New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div key={project._id || project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-gray-600">{project.address}</p>
                <p className="text-sm mt-2">Status: {project.status}</p>
                <button 
                  className="mt-3 text-blue-500 hover:text-blue-700 text-sm font-medium"
                  onClick={() => navigate(`/projects/${project._id || project.id}`)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;