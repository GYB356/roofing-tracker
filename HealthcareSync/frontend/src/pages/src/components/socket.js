import io from 'socket.io-client';

// Initialize socket connection
const socket = io(process.env.REACT_APP_SOCKET_URL, {
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "abcd"
  }
});

export default socket; 