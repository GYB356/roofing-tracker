import axios from 'axios';
import { createCache } from '../utils/performanceUtils';

// Create cache for AI responses to improve performance
const aiResponseCache = createCache(50);

/**
 * Service for AI-powered health analytics and insights
 * Integrates with OpenAI and other machine learning services
 */
class AIService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/api';
    this.mockMode = process.env.REACT_APP_USE_MOCK_API === 'true';
    
    // Mock data for development
    this.mockResponses = {
      healthInsights: [
        { id: 'ins1', type: 'trend', title: 'Blood Pressure Improving', description: 'Your blood pressure readings show consistent improvement over the past 3 months.', confidence: 0.92, severity: 'positive' },
        { id: 'ins2', type: 'suggestion', title: 'Increase Water Intake', description: 'Based on your hydration metrics, consider increasing daily water consumption by 20%.', confidence: 0.85, severity: 'moderate' },
        { id: 'ins3', type: 'alert', title: 'Irregular Sleep Pattern', description: 'Your sleep tracker indicates irregular sleep patterns that may affect recovery.', confidence: 0.78, severity: 'warning' }
      ],
      riskAssessment: [
        { id: 'risk1', condition: 'Hypertension', probability: 0.32, factors: ['Family history', 'Stress levels', 'Diet'], trend: 'decreasing' },
        { id: 'risk2', condition: 'Type 2 Diabetes', probability: 0.15, factors: ['BMI', 'Activity level'], trend: 'stable' },
        { id: 'risk3', condition: 'Sleep Apnea', probability: 0.58, factors: ['Sleep patterns', 'BMI', 'Snoring reported'], trend: 'increasing' }
      ],
      medicationInsights: [
        { id: 'med1', medication: 'Lisinopril', insight: 'Effectiveness appears optimal based on blood pressure response', alternatives: ['Losartan', 'Enalapril'] },
        { id: 'med2', medication: 'Metformin', insight: 'Current dosage may need adjustment based on recent A1C levels', alternatives: [] }
      ]
    };
  }

  /**
   * Get personalized health insights for a patient
   * @param {string} patientId - The patient's unique identifier
   * @param {Object} options - Additional options for the insights
   * @returns {Promise<Array>} - Array of health insights
   */
  async getHealthInsights(patientId, options = {}) {
    const cacheKey = `insights_${patientId}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (aiResponseCache.has(cacheKey)) {
      return aiResponseCache.get(cacheKey);
    }
    
    try {
      // Use mock data in development mode
      if (this.mockMode) {
        const response = { data: this.mockResponses.healthInsights };
        aiResponseCache.set(cacheKey, response.data);
        return response.data;
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/ai/insights/${patientId}`, {
        headers: this.getAuthHeaders(),
        params: options
      });
      
      // Cache the response
      aiResponseCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting AI health insights:', error);
      throw new Error(`Failed to get health insights: ${error.message}`);
    }
  }
  
  /**
   * Generate health risk assessment for a patient
   * @param {string} patientId - The patient's unique identifier
   * @returns {Promise<Array>} - Array of risk assessments
   */
  async getRiskAssessment(patientId) {
    const cacheKey = `risks_${patientId}`;
    
    // Check cache first
    if (aiResponseCache.has(cacheKey)) {
      return aiResponseCache.get(cacheKey);
    }
    
    try {
      // Use mock data in development mode
      if (this.mockMode) {
        const response = { data: this.mockResponses.riskAssessment };
        aiResponseCache.set(cacheKey, response.data);
        return response.data;
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/ai/risk-assessment/${patientId}`, {
        headers: this.getAuthHeaders()
      });
      
      // Cache the response
      aiResponseCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting AI risk assessment:', error);
      throw new Error(`Failed to get risk assessment: ${error.message}`);
    }
  }
  
  /**
   * Analyze symptoms to suggest possible conditions
   * @param {string} patientId - The patient's unique identifier
   * @param {Array} symptoms - Array of symptom descriptions
   * @returns {Promise<Array>} - Array of possible conditions with probability
   */
  async analyzeSymptoms(patientId, symptoms) {
    try {
      // Real API call
      const response = await axios.post(`${this.apiUrl}/ai/symptom-analysis`, {
        patientId,
        symptoms
      }, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      throw new Error(`Failed to analyze symptoms: ${error.message}`);
    }
  }
  
  /**
   * Get medication insights and suggestions
   * @param {string} patientId - The patient's unique identifier
   * @returns {Promise<Array>} - Array of medication insights
   */
  async getMedicationInsights(patientId) {
    const cacheKey = `medications_${patientId}`;
    
    // Check cache first
    if (aiResponseCache.has(cacheKey)) {
      return aiResponseCache.get(cacheKey);
    }
    
    try {
      // Use mock data in development mode
      if (this.mockMode) {
        const response = { data: this.mockResponses.medicationInsights };
        aiResponseCache.set(cacheKey, response.data);
        return response.data;
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/ai/medication-insights/${patientId}`, {
        headers: this.getAuthHeaders()
      });
      
      // Cache the response
      aiResponseCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting medication insights:', error);
      throw new Error(`Failed to get medication insights: ${error.message}`);
    }
  }
  
  /**
   * Generate a personalized health plan based on patient data
   * @param {string} patientId - The patient's unique identifier
   * @param {Object} goals - Patient's health goals
   * @returns {Promise<Object>} - Personalized health plan
   */
  async generateHealthPlan(patientId, goals) {
    try {
      // Real API call
      const response = await axios.post(`${this.apiUrl}/ai/health-plan`, {
        patientId,
        goals
      }, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating health plan:', error);
      throw new Error(`Failed to generate health plan: ${error.message}`);
    }
  }
  
  /**
   * Get authorization headers for API requests
   * @returns {Object} - Headers object with authorization token
   * @private
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Clear the AI response cache
   */
  clearCache() {
    aiResponseCache.clear();
  }
}

// Export singleton instance
export default new AIService(); 