import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.js';

/**
 * Service for handling emergency alerts and responses
 */
class EmergencyService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/api';
    this.mockMode = process.env.REACT_APP_USE_MOCK_API === 'true';
  }

  /**
   * Create a new emergency alert
   * @param {Object} alertData - The alert data
   * @param {string} alertData.type - The type of emergency (medical, assistance, etc)
   * @param {string} alertData.message - Description of the emergency
   * @param {Object} alertData.location - GPS coordinates or location description
   * @param {string} alertData.severity - Severity level (critical, urgent, moderate)
   * @returns {Promise<Object>} - The created alert
   */
  async createAlert(alertData) {
    try {
      // Use mock mode for development
      if (this.mockMode) {
        console.log('MOCK: Creating emergency alert', alertData);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          id: 'alert_' + Date.now(),
          ...alertData,
          status: 'sent',
          createdAt: new Date().toISOString()
        };
      }
      
      // Real API call
      const response = await axios.post(`${this.apiUrl}/emergency/alerts`, alertData, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating emergency alert:', error);
      throw new Error(`Failed to create emergency alert: ${error.message}`);
    }
  }
  
  /**
   * Get all active emergency alerts for the current user
   * @returns {Promise<Array>} - List of active alerts
   */
  async getActiveAlerts() {
    try {
      // Use mock mode for development
      if (this.mockMode) {
        console.log('MOCK: Getting active emergency alerts');
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return [
          {
            id: 'alert_1',
            type: 'medical',
            message: 'Patient reporting chest pain and shortness of breath',
            location: { latitude: 37.7749, longitude: -122.4194, description: 'Home' },
            severity: 'critical',
            status: 'active',
            createdAt: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
          },
          {
            id: 'alert_2',
            type: 'assistance',
            message: 'Patient needs help with medication',
            location: { latitude: 37.7849, longitude: -122.4294, description: 'Home' },
            severity: 'moderate',
            status: 'active',
            createdAt: new Date(Date.now() - 900000).toISOString() // 15 minutes ago
          }
        ];
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/emergency/alerts/active`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting active emergency alerts:', error);
      throw new Error(`Failed to get active alerts: ${error.message}`);
    }
  }
  
  /**
   * Update the status of an emergency alert
   * @param {string} alertId - The ID of the alert to update
   * @param {string} status - The new status (acknowledged, resolved, false_alarm)
   * @param {Object} updateData - Additional update data
   * @returns {Promise<Object>} - The updated alert
   */
  async updateAlertStatus(alertId, status, updateData = {}) {
    try {
      // Use mock mode for development
      if (this.mockMode) {
        console.log(`MOCK: Updating alert ${alertId} to status ${status}`, updateData);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          id: alertId,
          status,
          updatedAt: new Date().toISOString(),
          ...updateData
        };
      }
      
      // Real API call
      const response = await axios.put(`${this.apiUrl}/emergency/alerts/${alertId}/status`, {
        status,
        ...updateData
      }, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating emergency alert status:', error);
      throw new Error(`Failed to update alert status: ${error.message}`);
    }
  }
  
  /**
   * Get emergency contacts for a patient
   * @param {string} patientId - The patient's ID
   * @returns {Promise<Array>} - List of emergency contacts
   */
  async getEmergencyContacts(patientId) {
    try {
      // Use mock mode for development
      if (this.mockMode) {
        console.log(`MOCK: Getting emergency contacts for patient ${patientId}`);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return [
          {
            id: 'contact_1',
            name: 'John Smith',
            relationship: 'Spouse',
            phone: '555-123-4567',
            email: 'john.smith@example.com',
            isAuthorized: true
          },
          {
            id: 'contact_2',
            name: 'Mary Johnson',
            relationship: 'Daughter',
            phone: '555-987-6543',
            email: 'mary.johnson@example.com',
            isAuthorized: true
          }
        ];
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/patients/${patientId}/emergency-contacts`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      throw new Error(`Failed to get emergency contacts: ${error.message}`);
    }
  }
  
  /**
   * Get emergency response protocol for a specific type of emergency
   * @param {string} emergencyType - The type of emergency
   * @returns {Promise<Object>} - The emergency protocol
   */
  async getEmergencyProtocol(emergencyType) {
    try {
      // Use mock mode for development
      if (this.mockMode) {
        console.log(`MOCK: Getting emergency protocol for ${emergencyType}`);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const protocols = {
          medical: {
            id: 'protocol_medical',
            title: 'Medical Emergency Protocol',
            steps: [
              'Assess patient condition and ensure safety',
              'Contact emergency services if necessary',
              'Notify primary care provider',
              'Document the incident',
              'Schedule follow-up appointment'
            ],
            escalationPath: ['Nurse on duty', 'Primary physician', 'Emergency services']
          },
          assistance: {
            id: 'protocol_assistance',
            title: 'Assistance Request Protocol',
            steps: [
              'Assess patient needs',
              'Provide requested assistance if qualified',
              'Contact appropriate staff member if needed',
              'Document the assistance provided',
              'Follow up with patient'
            ],
            escalationPath: ['Care assistant', 'Nurse on duty', 'Patient coordinator']
          },
          fall: {
            id: 'protocol_fall',
            title: 'Fall Response Protocol',
            steps: [
              'Assess patient for injuries',
              'Do not move patient if serious injury is suspected',
              'Contact emergency services if necessary',
              'Document the incident including cause if known',
              'Schedule follow-up assessment'
            ],
            escalationPath: ['Nurse on duty', 'Primary physician', 'Emergency services']
          }
        };
        
        return protocols[emergencyType] || protocols.medical;
      }
      
      // Real API call
      const response = await axios.get(`${this.apiUrl}/emergency/protocols/${emergencyType}`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting emergency protocol:', error);
      throw new Error(`Failed to get emergency protocol: ${error.message}`);
    }
  }
  
  /**
   * Send emergency notification to responders and emergency contacts
   * @param {string} alertId - The ID of the emergency alert
   * @param {Array} recipientIds - List of recipient IDs
   * @returns {Promise<Object>} - Notification status
   */
  async sendEmergencyNotifications(alertId, recipientIds) {
    try {
      // Use mock mode for development
      if (this.mockMode) {
        console.log(`MOCK: Sending emergency notifications for alert ${alertId} to`, recipientIds);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        return {
          success: true,
          sentTo: recipientIds.length,
          timestamp: new Date().toISOString()
        };
      }
      
      // Real API call
      const response = await axios.post(`${this.apiUrl}/emergency/alerts/${alertId}/notify`, {
        recipientIds
      }, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending emergency notifications:', error);
      throw new Error(`Failed to send notifications: ${error.message}`);
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
}

// Export singleton instance
export default new EmergencyService();