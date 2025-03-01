import React, { createContext, useContext } from 'react';

// Create context
const SocketContext = createContext(null);

// Custom hook to use the socket context
export const useSocket = () => {
  return useContext(SocketContext);
};

// Socket provider component
export const SocketProvider = ({ children, value }) => {
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 