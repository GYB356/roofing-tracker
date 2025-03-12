import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import EmergencyService from '../../services/EmergencyService.js';
import { 
  AlertTriangle, 
  Bell, 
  Shield, 
  Phone, 
  HelpCircle,
  HeartPulse,
  Pill,
  Clock,
  MapPin
} from 'lucide-react';

/**
 * Component for creating and managing emergency alerts
 */
const EmergencyAlertSystem = () => {
  const { currentUser } = useAuth();
  const [alertType, setAlertType] = useState('medical');
  const [alertMessage, setAlertMessage] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('urgent');
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [protocolSteps, setProtocolSteps] = useState([]);
  
  // Get device location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationString = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setLocation(locationString);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('Location unavailable');
        }
      );
    } else {
      setLocation('Geolocation not supported');
    }
  }, []);
  
  // Fetch emergency contacts and protocol
  useEffect(() => {
    const fetchEmergencyData = async () => {
      try {
        if (!currentUser) return;
        
        // Get emergency contacts
        const contacts = await EmergencyService.getEmergencyContacts(currentUser.id);
        setEmergencyContacts(contacts);
        
        // Set default selected contacts
        setSelectedContacts(contacts.filter(contact => contact.isAuthorized).map(contact => contact.id));
        
        // Get protocol steps for selected emergency type
        const protocol = await EmergencyService.getEmergencyProtocol(alertType);
        setProtocolSteps(protocol.steps);
        
        // Get current location
        getCurrentLocation();
      } catch (err) {
        console.error('Error fetching emergency data:', err);
        setError('Failed to load emergency contacts. Please try again.');
      }
    };
    
    fetchEmergencyData();
  }, [currentUser, alertType, getCurrentLocation]);
  
  // Update protocol steps when alert type changes
  useEffect(() => {
    const updateProtocol = async () => {
      try {
        const protocol = await EmergencyService.getEmergencyProtocol(alertType);
        setProtocolSteps(protocol.steps);
      } catch (err) {
        console.error('Error updating protocol:', err);
      }
    };
    
    updateProtocol();
  }, [alertType]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!alertMessage.trim()) {
      setError('Please provide details about your emergency');
      return;
    }
    
    try {
      setSending(true);
      setError(null);
      
      // Create emergency alert
      const alertData = {
        type: alertType,
        message: alertMessage,
        severity,
        location: { description: location },
        contactIds: selectedContacts
      };
      
      const createdAlert = await EmergencyService.createAlert(alertData);
      
      // Send notifications to emergency contacts
      if (selectedContacts.length > 0) {
        await EmergencyService.sendEmergencyNotifications(
          createdAlert.id, 
          selectedContacts
        );
      }
      
      // Show success message
      setSuccess(true);
      setAlertMessage('');
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error sending emergency alert:', err);
      setError('Failed to send emergency alert. Please call emergency services directly if this is a life-threatening situation.');
    } finally {
      setSending(false);
    }
  };
  
  // Toggle contact selection
  const toggleContact = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };
  
  // Get icon based on alert type
  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'medical':
        return <HeartPulse className="h-5 w-5" />;
      case 'medication':
        return <Pill className="h-5 w-5" />;
      case 'assistance':
        return <HelpCircle className="h-5 w-5" />;
      case 'fall':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-red-600 p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-white" />
          <h2 className="text-xl font-bold text-white ml-2">Emergency Alert System</h2>
        </div>
        <p className="text-red-100 mt-1 text-sm">
          For life-threatening emergencies, always call emergency services directly at 911.
        </p>
      </div>
      
      <div className="p-6">
        {success ? (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Emergency alert sent successfully. Help is on the way.
                </p>
              </div>
            </div>
          </div>
        ) : null}
        
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : null}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Type
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                  alertType === 'medical' 
                    ? 'bg-red-50 border-red-500 text-red-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setAlertType('medical')}
              >
                <HeartPulse className="h-5 w-5 mr-2" />
                <span>Medical</span>
              </button>
              
              <button
                type="button"
                className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                  alertType === 'medication' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setAlertType('medication')}
              >
                <Pill className="h-5 w-5 mr-2" />
                <span>Medication</span>
              </button>
              
              <button
                type="button"
                className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                  alertType === 'assistance' 
                    ? 'bg-green-50 border-green-500 text-green-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setAlertType('assistance')}
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                <span>Assistance</span>
              </button>
              
              <button
                type="button"
                className={`flex items-center justify-center px-4 py-3 border rounded-md ${
                  alertType === 'fall' 
                    ? 'bg-yellow-50 border-yellow-500 text-yellow-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setAlertType('fall')}
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>Fall</span>
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Severity
            </label>
            <div className="flex">
              <button
                type="button"
                className={`flex-1 py-2 ${
                  severity === 'moderate' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                } rounded-l-md`}
                onClick={() => setSeverity('moderate')}
              >
                Moderate
              </button>
              <button
                type="button"
                className={`flex-1 py-2 ${
                  severity === 'urgent' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setSeverity('urgent')}
              >
                Urgent
              </button>
              <button
                type="button"
                className={`flex-1 py-2 ${
                  severity === 'critical' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                } rounded-r-md`}
                onClick={() => setSeverity('critical')}
              >
                Critical
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="emergencyMessage" className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Emergency
            </label>
            <textarea
              id="emergencyMessage"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              rows="4"
              placeholder="Please describe what's happening and what help you need..."
              required
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Your Location
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Update Location
              </button>
            </div>
            <div className="mt-2 flex items-center bg-gray-50 px-3 py-2 border border-gray-300 rounded-md">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-700">{location || 'Fetching location...'}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowContacts(!showContacts)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {showContacts ? (
                <>Hide Emergency Contacts</>
              ) : (
                <>Show Emergency Contacts ({emergencyContacts.length})</>
              )}
            </button>
            
            {showContacts && (
              <div className="mt-3 border border-gray-200 rounded-md p-3">
                <p className="text-sm text-gray-600 mb-2">
                  Select contacts to notify about this emergency:
                </p>
                
                {emergencyContacts.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No emergency contacts found</p>
                ) : (
                  <div className="space-y-2">
                    {emergencyContacts.map(contact => (
                      <div key={contact.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`contact-${contact.id}`}
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`contact-${contact.id}`} className="ml-2 text-sm text-gray-700">
                          {contact.name} ({contact.relationship}) - {contact.phone}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Emergency Protocol:</h3>
            <ol className="list-decimal list-inside space-y-1">
              {protocolSteps.map((step, index) => (
                <li key={index} className="text-sm text-gray-600">{step}</li>
              ))}
            </ol>
          </div>
          
          <div className="flex items-center justify-between">
            <a 
              href="tel:911" 
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Phone className="h-5 w-5 mr-2" />
              Call 911
            </a>
            
            <button
              type="submit"
              disabled={sending || !alertMessage.trim()}
              className="flex-1 ml-4 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending Alert...' : 'Send Emergency Alert'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Emergency alerts are monitored 24/7 by our healthcare team. Response times may vary depending on alert severity and staff availability.
        </p>
      </div>
    </div>
  );
};

export default EmergencyAlertSystem; 