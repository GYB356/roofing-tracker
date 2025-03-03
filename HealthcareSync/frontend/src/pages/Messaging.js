import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Messaging = () => {
    const { user, hasRole } = useAuth();
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!hasRole(['doctor', 'nurse', 'admin', 'patient'])) {
            setError('Access Denied');
            return;
        }

        // Fetch initial messages
        const fetchMessages = async () => {
            try {
                const response = await fetch('/api/messages');
                const data = await response.json();
                setMessages(data);
            } catch (err) {
                setError('Failed to load messages');
            }
        };

        fetchMessages();

        if (socket) {
            socket.on('newMessage', (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            });
        }

        return () => {
            if (socket) {
                socket.off('newMessage');
            }
        };
    }, [hasRole, socket]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newMessage, userId: user.id }),
            });
            const message = await response.json();
            setMessages((prevMessages) => [...prevMessages, message]);
            setNewMessage('');
        } catch (err) {
            setError('Failed to send message');
        }
    };

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="messaging-page p-4">
            <h1 className="text-2xl font-bold">Messaging</h1>
            <div className="messages-list mb-4">
                {messages.map((message) => (
                    <div key={message.id} className="mb-2">
                        <strong>{message.userName}:</strong> {message.content}
                    </div>
                ))}
            </div>
            <div className="send-message flex">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow p-2 border rounded"
                    placeholder="Type your message..."
                />
                <button
                    onClick={handleSendMessage}
                    className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Messaging; 