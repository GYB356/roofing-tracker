import axios from 'axios';

// Mock AI integration for development
const mockAIResponses = {
  'health_insights': [
    { insight: 'Your blood pressure readings show improvement over the last 3 months', confidence: 0.92 },
    { insight: 'Consider increasing water intake based on your recent lab results', confidence: 0.85 },
    { insight: 'Your medication adherence has improved by 15% this month', confidence: 0.94 }
  ],
  'treatment_suggestions': [
    { suggestion: 'Based on your symptoms, consider discussing allergy testing with your doctor', confidence: 0.78 },
    { suggestion: 'Your sleep pattern data suggests potential sleep apnea. Consider a sleep study.', confidence: 0.82 }
  ],
  'risk_analysis': [
    { risk: 'Moderate risk of hypertension based on family history and recent readings', score: 0.65 },
    { risk: 'Low risk of diabetes based on current metrics', score: 0.25 }
  ]
};

const aiService = {
  // Get health insights based on patient data
  getHealthInsights: async (patientId) => {
    try {
      // Use mock data in development
      if (process.env.REACT_APP_USE_MOCK_API === 'true') {
        return { data: mockAIResponses.health_insights };
      }
      
      // Real API call
      const response = await axios.get(`/api/ai/insights/${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error getting AI health insights:', error);
      throw error;
    }
  },
  
  // Get treatment suggestions
  getTreatmentSuggestions: async (patientId, symptoms) => {
    try {
      // Use mock data in development
      if (process.env.REACT_APP_USE_MOCK_API === 'true') {
        return { data: mockAIResponses.treatment_suggestions };
      }
      
      // Real API call
      const response = await axios.post('/api/ai/treatment-suggestions', {
        patientId,
        symptoms
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error getting AI treatment suggestions:', error);
      throw error;
    }
  },
  
  // Analyze health risks
  analyzeHealthRisks: async (patientId) => {
    try {
      // Use mock data in development
      if (process.env.REACT_APP_USE_MOCK_API === 'true') {
        return { data: mockAIResponses.risk_analysis };
      }
      
      // Real API call
      const response = await axios.get(`/api/ai/risk-analysis/${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error analyzing health risks:', error);
      throw error;
    }
  }
};

export default aiService; 