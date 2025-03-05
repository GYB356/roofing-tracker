// src/contexts/SessionContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { generateSessionId, auditLog } from '../utils/security';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  
  // Session timeout settings (in milliseconds)
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  const WARNING_BEFORE_TIMEOUT = 60 * 1000; // 1 minute
  
  // Create a new session when user authenticates
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setLastActivity(Date.now());
      
      // Log session start
      auditLog('session_start', { sessionId: newSessionId }, currentUser.id);
      
      // Store session ID
      sessionStorage.setItem('sessionId', newSessionId);
      sessionStorage.setItem('sessionStart', Date.now().toString());
    } else {
      // Clear session data when not authenticated
      setSessionId(null);
      sessionStorage.removeItem('sessionId');
      sessionStorage.removeItem('sessionStart');
    }
  }, [isAuthenticated, currentUser]);
  
  // Update activity timestamp on user interaction
  const updateActivity = () => {
    setLastActivity(Date.now());
    setIsWarningOpen(false);
  };
  
  // Add event listeners for user activity
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      updateActivity();
    };
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated]);
  
  // Check for session timeout
  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;
    
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        // Session timeout reached
        clearInterval(checkInterval);
        
        // Log session timeout
        auditLog('session_timeout', { 
          sessionId,
          sessionDuration: now - parseInt(sessionStorage.getItem('sessionStart') || '0')
        }, currentUser?.id);
        
        // Logout the user
        logout();
      } else if (timeSinceLastActivity >= SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT && !isWarningOpen) {
        // Show warning before timeout
        setIsWarningOpen(true);
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [isAuthenticated, lastActivity, sessionId, currentUser, logout, isWarningOpen]);
  
  // Session timeout warning modal
  const SessionTimeoutWarning = () => {
    if (!isWarningOpen) return null;
    
    // Calculate time remaining
    const timeRemaining = Math.max(0, SESSION_TIMEOUT - (Date.now() - lastActivity));
    const minutesRemaining = Math.floor(timeRemaining / 60000);
    const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4">Session Timeout Warning</h2>
          <p className="mb-4">
            Your session will expire in {minutesRemaining}:{secondsRemaining < 10 ? '0' : ''}{secondsRemaining} minutes due to inactivity.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={logout}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
            >
              Logout Now
            </button>
            <button
              onClick={updateActivity}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continue Session
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <SessionContext.Provider value={{ sessionId, updateActivity }}>
      {children}
      <SessionTimeoutWarning />
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};