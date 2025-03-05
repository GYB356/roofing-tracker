import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-toastify';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { connected, socket, emit, subscribe } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Existing state and other methods...

  // Enhanced socket connection handling
  useEffect(() => {
    if (connected) {
      // Optional: Listen for specific socket events
      const serverNotificationHandler = (data) => {
        toast.info(data.message, {
          position: 'top-right',
          autoClose: 3000
        });
      };

      subscribe('server-notification', serverNotificationHandler);

      // Optional: Send connection confirmation
      emit('client-connected', { userId: user?.id });

      return () => {
        // Cleanup subscription
        socket?.off('server-notification', serverNotificationHandler);
      };
    }
  }, [connected, user]);

  // Socket connection status component
  const SocketStatusIndicator = () => (
    <div 
      className="ml-3 flex items-center tooltip-container"
      title={connected ? 'Socket Connected' : 'Socket Disconnected'}
    >
      {connected ? (
        <FiWifi 
          className="text-green-500 hover:text-green-600" 
          size={20} 
        />
      ) : (
        <FiWifiOff 
          className="text-red-500 hover:text-red-600" 
          size={20} 
        />
      )}
    </div>
  );

  // Replace the existing connection status indicator with SocketStatusIndicator
  // In the render method, where you currently have the connection dot

  return (
    <nav>
      {/* Existing code... */}
      <div className="flex items-center">
        {/* Other navbar items */}
        <SocketStatusIndicator />
        {/* Rest of navbar */}
      </div>
    </nav>
  );
};

export default Navbar;