import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import AIService from '../../services/AIService.js';
import { 
  Lightbulb, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

/**
 * Component that displays AI-generated health insights for the patient
 */
const HealthInsightsPanel = () => {
  const { currentUser } = useAuth();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  
  useEffect(() => {
    const fetchInsights = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const data = await AIService.getHealthInsights(currentUser.id);
        setInsights(data);
        
        // Initialize expanded state
        const expandedState = {};
        data.forEach(insight => {
          expandedState[insight.id] = false;
        });
        setExpanded(expandedState);
      } catch (err) {
        console.error('Error fetching health insights:', err);
        setError('Failed to load health insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInsights();
  }, [currentUser]);
  
  const toggleInsight = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Get icon based on insight type
  const getInsightIcon = (type, severity) => {
    if (type === 'trend') {
      return severity === 'positive' ? 
        <TrendingUp className="h-5 w-5 text-green-500" /> : 
        <TrendingDown className="h-5 w-5 text-red-500" />;
    }
    
    if (type === 'alert') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    
    if (type === 'suggestion') {
      return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
    
    return <Zap className="h-5 w-5 text-purple-500" />;
  };
  
  // Get background color based on severity
  const getBackgroundColor = (severity) => {
    switch (severity) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'moderate':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">AI Health Insights</h2>
          <Activity className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">AI Health Insights</h2>
          <Activity className="h-5 w-5 text-blue-500" />
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">AI Health Insights</h2>
        <Activity className="h-5 w-5 text-blue-500" />
      </div>
      
      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No health insights available yet. Continue tracking your health data to receive personalized insights.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map(insight => (
            <div 
              key={insight.id} 
              className={`border rounded-lg overflow-hidden transition-all duration-200 ${getBackgroundColor(insight.severity)}`}
            >
              <div 
                className="p-4 flex items-start justify-between cursor-pointer"
                onClick={() => toggleInsight(insight.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type, insight.severity)}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{insight.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {expanded[insight.id] ? insight.description : insight.description.substring(0, 60) + (insight.description.length > 60 ? '...' : '')}
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  {expanded[insight.id] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
              
              {expanded[insight.id] && (
                <div className="px-4 pb-4 pt-1">
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Confidence: </span>
                    <span>{Math.round(insight.confidence * 100)}%</span>
                  </div>
                  
                  <div className="mt-3">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Learn More
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <div className="mt-4 pt-2 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-2">
              Health insights are generated using artificial intelligence and should not replace professional medical advice.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All Insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthInsightsPanel; 