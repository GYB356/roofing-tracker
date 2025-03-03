import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, isAuthenticated } = useAuth();
    
    useEffect(() => {
        if (isAuthenticated && user) {
            // Initialize socket connection
            const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
                auth: {
                    token: localStorage.getItem('token')
                },
                query: {
                    userId: user.id,
                    userRole: user.role
                }
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                newSocket.close();
            };
        } else {
            // Close socket if user logs out
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [isAuthenticated, user]);

    // Join a telemedicine session
    const joinTelemedicineSession = (sessionId) => {
        if (socket) {
            socket.emit('joinTelemedicineSession', sessionId);
        }
    };

    // Leave a telemedicine session
    const leaveTelemedicineSession = (sessionId) => {
        if (socket) {
            socket.emit('leaveTelemedicineSession', sessionId);
        }
    };

    // Update staff schedule
    const updateSchedule = (scheduleData) => {
        if (socket) {
            socket.emit('scheduleUpdate', scheduleData);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, joinTelemedicineSession, leaveTelemedicineSession, updateSchedule }}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketContext, SocketProvider };