import { useEffect, useState, useMemo, useCallback } from 'react';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL);

// Main Telemedicine component
function Telemedicine() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showNewConsultationModal, setShowNewConsultationModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  
  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserId(user.id);
      fetchConsultations(user.id, user.role);
    } else {
      setError('User not authenticated');
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // Listen for consultation updates
    socket.on('consultationUpdate', (update) => {
      setConsultations((prevConsultations) => {
        return prevConsultations.map((consultation) =>
          consultation.id === update.id ? { ...consultation, ...update } : consultation
        );
      });
    });

    // Add WebSocket event listeners for consultation status updates and join notifications
    socket.on('consultationStatusUpdate', (update) => {
      setConsultations((prevConsultations) => {
        return prevConsultations.map((consultation) =>
          consultation.id === update.id ? { ...consultation, ...update } : consultation
        );
      });
    });

    socket.on('consultationJoinNotification', (notification) => {
      // Handle join notification, e.g., show a toast or update UI
    });

    // Clean up on component unmount
    return () => {
      socket.off('consultationUpdate');
      socket.off('consultationStatusUpdate');
      socket.off('consultationJoinNotification');
    };
  }, []);
  
  const fetchConsultations = useCallback(async (id, role) => {
    try {
      setIsLoading(true);
      const endpoint = role === 'patient' 
        ? `/api/consultations/patient/${id}` 
        : `/api/consultations/doctor/${id}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch consultations');
      }
      
      const data = await response.json();
      setConsultations(data);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleNewConsultation = () => {
    setShowNewConsultationModal(true);
  };
  
  const handleCloseModal = () => {
    setShowNewConsultationModal(false);
    setSelectedConsultation(null);
  };
  
  const handleConsultationCreated = (newConsultation) => {
    setConsultations([...consultations, newConsultation]);
    handleCloseModal();
  };
  
  const handleJoinConsultation = (consultation) => {
    setSelectedConsultation(consultation);
    // Navigate to video consultation room
    window.location.href = `/consultation-room/${consultation.id}`;
  };
  
  const filterConsultations = () => {
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return consultations.filter(c => new Date(c.scheduledTime) > now && c.status !== 'completed');
    } else if (activeTab === 'past') {
      return consultations.filter(c => new Date(c.scheduledTime) < now || c.status === 'completed');
    }
    return consultations;
  };

  const filteredConsultations = useMemo(() => filterConsultations(), [consultations, activeTab]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8" role="main">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary" tabIndex="0">Telemedicine Consultations</h1>
        {userRole === 'patient' && (
          <button 
            onClick={handleNewConsultation}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
            aria-label="Request New Consultation"
          >
            Request New Consultation
          </button>
        )}
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Consultation Tabs">
            <button
              className={`${
                activeTab === 'upcoming'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm sm:text-base sm:px-4`}
              onClick={() => handleTabChange('upcoming')}
              aria-selected={activeTab === 'upcoming'}
            >
              Upcoming
            </button>
            <button
              className={`${
                activeTab === 'past'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm sm:text-base sm:px-4 ml-8`}
              onClick={() => handleTabChange('past')}
              aria-selected={activeTab === 'past'}
            >
              Past
            </button>
          </nav>
        </div>
      </div>
      
      <ConsultationsList 
        consultations={filteredConsultations} 
        userRole={userRole} 
        onJoin={handleJoinConsultation} 
      />
      
      {showNewConsultationModal && (
        <NewConsultationModal 
          onClose={handleCloseModal} 
          onConsultationCreated={handleConsultationCreated}
          patientId={userId}
        />
      )}
    </div>
  );
}

// Component to display list of consultations
function ConsultationsList({ consultations, userRole, onJoin }) {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No consultations found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {consultations.map((consultation) => (
          <ConsultationItem 
            key={consultation.id} 
            consultation={consultation} 
            userRole={userRole}
            onJoin={onJoin}
          />
        ))}
      </ul>
    </div>
  );
}

// Component for individual consultation item
function ConsultationItem({ consultation, userRole, onJoin }) {
  const isUpcoming = new Date(consultation.scheduledTime) > new Date();
  const canJoin = isUpcoming && consultation.status !== 'cancelled';
  const formattedDate = new Date(consultation.scheduledTime).toLocaleString();
  
  // Determine which name to display based on user role
  const displayName = userRole === 'patient' 
    ? `Dr. ${consultation.doctorName}` 
    : consultation.patientName;
  
  // Determine status color
  const getStatusColor = () => {
    switch(consultation.status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <li>
      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-primary truncate">
              {displayName}
            </p>
            <p className="text-sm text-gray-500">
              {formattedDate}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor()}`}>
              {consultation.status}
            </span>
            {canJoin && (
              <button
                onClick={() => onJoin(consultation)}
                className="ml-4 bg-primary hover:bg-primary-dark text-white text-sm font-medium py-1 px-3 rounded"
              >
                Join
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 sm:flex sm:justify-between">
          <div className="sm:flex">
            <p className="flex items-center text-sm text-gray-500">
              <span>{consultation.reason}</span>
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

// Modal for creating new consultation
function NewConsultationModal({ onClose, onConsultationCreated, patientId }) {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    doctorId: '',
    scheduledTime: '',
    reason: '',
    patientId: patientId
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('/api/doctors');
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const data = await response.json();
        setDoctors(data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create consultation');
      }

      const newConsultation = await response.json();
      onConsultationCreated(newConsultation);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-primary">Request New Consultation</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="doctorId">
                Select Doctor
              </label>
              <select
                id="doctorId"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select a doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledTime">
                Date and Time
              </label>
              <input
                id="scheduledTime"
                name="scheduledTime"
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={handleChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason">
                Reason for Consultation
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows="3"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
              >
                Request Consultation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Simple spinner component for loading states
function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

// Video consultation room component
function ConsultationRoom() {
  const [consultation, setConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Get consultation ID from URL
  const consultationId = window.location.pathname.split('/').pop();
  
  useEffect(() => {
    const fetchConsultationDetails = async () => {
      try {
        const response = await fetch(`/api/consultations/${consultationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch consultation details');
        }
        
        const data = await response.json();
        setConsultation(data);
        setIsLoading(false);
        
        // Initialize WebRTC after consultation details are loaded
        initializeMedia();
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    fetchConsultationDetails();
    
    // Cleanup function to stop media streams when component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [consultationId]);
  
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Here you would initialize WebRTC connection
      // This is a simplified example - in a real app you'd need to:
      // 1. Set up signaling server
      // 2. Create RTCPeerConnection
      // 3. Add tracks from local stream
      // 4. Exchange ICE candidates
      // 5. Set up remote stream when connected
      
    } catch (err) {
      setError("Could not access camera and microphone: " + err.message);
    }
  };
  
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  const endCall = () => {
    // In a real app, you would:
    // 1. Close the RTCPeerConnection
    // 2. Update the consultation status in the database
    // 3. Redirect to the consultations list
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    window.location.href = '/telemedicine';
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }
  
  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">
            Consultation with {consultation.patientName}
          </h1>
          <div className="text-sm text-gray-500">
            {new Date(consultation.scheduledTime).toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto p-4 flex flex-col md:flex-row gap-4">
        <div className="md:w-3/4 bg-black rounded-lg overflow-hidden relative">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white">Waiting for other participant to join...</p>
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 w-1/4 h-1/4 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        <div className="md:w-1/4 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Consultation Details</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-500">Patient</p>
            <p className="font-medium">{consultation.patientName}</p>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-500">Doctor</p>
            <p className="font-medium">Dr. {consultation.doctorName}</p>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-500">Reason</p>
            <p>{consultation.reason}</p>
          </div>
          
          <div className="mt-auto">
            <h3 className="text-md font-semibold mb-2">Notes</h3>
            <textarea 
              className="w-full border rounded p-2 text-sm" 
              rows="4"
              placeholder="Add consultation notes here..."
            ></textarea>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-center gap-4">
          <button 
            onClick={toggleMute}
            className={`rounded-full p-3 ${isMuted ? 'bg-red-500' : 'bg-gray-200'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`rounded-full p-3 ${isVideoOff ? 'bg-red-500' : 'bg-gray-200'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isVideoOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </button>
          
          <button 
            onClick={endCall}
            className="rounded-full p-3 bg-red-500 text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Telemedicine; 