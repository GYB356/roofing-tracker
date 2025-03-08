import React, { useState, useEffect, useRef, useContext } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import useMediaDevices from '../hooks/useMediaDevices';
import { encryptData } from '../utils/security';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
  ]
};

const TelemedicinePage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaConstraints = {
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true
  };

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;
        setLoading(false);
      } catch (err) {
        setError('Failed to access media devices. Please check permissions.');
        setLoading(false);
      }
    };

    initializeMedia();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('ice-candidate', encryptData({
          candidate,
          sessionId: user.currentSession,
          userId: user.id
        }));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach(track =>
      pc.addTrack(track, localStream)
    );

    setPeerConnection(pc);
  };

  const handleConsultationNoteChange = (e) => {
    setConsultationNotes(encryptData(e.target.value));
  };

  const handleEndCall = () => {
    peerConnection?.close();
    setIsCallActive(false);
    socket.emit('end-call', { sessionId: user.currentSession });
  };

  useEffect(() => {
    const handleSocketEvents = () => {
      socket.on('offer', async ({ offer, sessionId }) => {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit('answer', encryptData({
            answer,
            sessionId,
            userId: user.id
          }));
        } catch (err) {
          setError('Failed to handle call offer');
        }
      });
    
      socket.on('answer', ({ answer }) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });
    
      socket.on('ice-candidate', ({ candidate }) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });
    
      socket.on('call-ended', () => {
        handleEndCall();
        setError('Call ended by remote participant');
      });
    };
  
    if (socket) handleSocketEvents();
  
    return () => {
      if (socket) {
        socket.off('offer');
        socket.off('answer');
        socket.off('ice-candidate');
        socket.off('call-ended');
      }
    };
  }, [socket, peerConnection, user.id]);

  const startCall = async (participantId) => {
    try {
      await createPeerConnection();
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket.emit('start-call', encryptData({
        offer,
        participantId,
        userId: user.id,
        sessionType: 'telemedicine'
      }));
      setIsCallActive(true);
    } catch (err) {
      setError('Failed to initiate call');
    }
  };

  if (loading) return <div className="loading-indicator">Initializing media devices...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="telemedicine-container bg-gray-900 text-white p-6 rounded-lg">
      <div className="video-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="local-video bg-gray-800 rounded-lg"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className="remote-video bg-gray-800 rounded-lg"
        />
      </div>

      <div className="consultation-notes mb-6">
        <textarea
          value={consultationNotes}
          onChange={handleConsultationNoteChange}
          className="w-full bg-gray-800 rounded-lg p-4"
          placeholder="Enter consultation notes..."
          disabled={!isCallActive}
        />
      </div>

      <div className="controls flex justify-center gap-4">
        <button
          onClick={handleEndCall}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
          disabled={!isCallActive}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default TelemedicinePage;