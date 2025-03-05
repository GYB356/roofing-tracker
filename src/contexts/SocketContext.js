import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// Create context with default values
const SocketContext = createContext({
  socket: null,
  connected: false,
  emit: () => {},
  subscribe: () => {},
});

// Socket provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      setSocket(newSocket);
      setConnected(true);
      toast.success('Socket connected', { 
        position: 'bottom-right', 
        autoClose: 2000 
      });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      toast.warn('Socket disconnected', { 
        position: 'bottom-right',
        autoClose: 2000 
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Socket connection failed', { 
        position: 'bottom-right' 
      });
    });

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Socket methods
  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      toast.error('Socket not connected');
    }
  };

  const subscribe = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  };

  // Context value
  const contextValue = {
    socket,
    connected,
    emit,
    subscribe
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  // Provide default values to prevent null destructuring
  return context || {
    socket: null,
    connected: false,
    emit: () => {},
    subscribe: () => {}
  };
};

export default SocketContext;