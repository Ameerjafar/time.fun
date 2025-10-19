"use client";
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Users, 
  Monitor,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SIGNALING_SERVER = "ws://localhost:8080";
const STUN_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ],
};

const WebRTCPage = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [callDuration, setCallDuration] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isHttps, setIsHttps] = useState(true);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<number>(0);

  // Generate room code and check HTTPS
  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    
    // Check if running on HTTPS
    setIsHttps(window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  }, []);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && callStartTimeRef.current > 0) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const startCall = async () => {
    if (!roomId.trim()) return;
    
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setPermissionError(null);

    try {
      // Check HTTPS requirement
      if (!isHttps) {
        throw new Error('HTTPS_REQUIRED');
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Local video stream set:', stream);
      }

      // Connect to signaling server
      const ws = new WebSocket(SIGNALING_SERVER);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('WebSocket connected, joining room:', roomId);
        ws.send(JSON.stringify({ 
          type: "join", 
          role: "sender", 
          room: roomId,
          user: user?.name || 'Anonymous'
        }));
        
        // Wait a moment for the join message to be processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create and send offer only after WebSocket is connected
        console.log('Creating offer...');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('Sending offer:', offer);
        ws.send(JSON.stringify({
          type: "offer",
          sdp: pc.localDescription,
          room: roomId
        }));
        
        setConnectionStatus('connected');
        setIsConnected(true);
        callStartTimeRef.current = Date.now();
        setIsConnecting(false);
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message.type);
        
        if (message.type === "participant-joined") {
          setParticipants(prev => [...prev, message.user]);
        } else if (message.type === "participant-left") {
          setParticipants(prev => prev.filter(p => p !== message.user));
        } else if (message.type === "offer") {
          await handleOffer(message);
        } else if (message.type === "answer") {
          await handleAnswer(message);
        } else if (message.type === "candidate") {
          await handleCandidate(message);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setIsConnecting(false);
      };

      // Create peer connection
      const pc = new RTCPeerConnection(STUN_CONFIG);
      pcRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track?.kind);
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log('Remote video stream set:', event.streams[0]);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
            room: roomId
          }));
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        setConnectionStatus(pc.connectionState);
      };

    } catch (error: any) {
      console.error('Error starting call:', error);
      setConnectionStatus('error');
      setIsConnecting(false);
      
      // Handle specific permission errors
      if (error.name === 'NotAllowedError' || error.message === 'Permission denied by user') {
        setPermissionError('Camera and microphone access was denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No camera or microphone found. Please check your devices.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Camera or microphone is already in use by another application.');
      } else if (error.message === 'HTTPS_REQUIRED') {
        setPermissionError('HTTPS is required for camera and microphone access. Please use HTTPS or localhost.');
      } else {
        setPermissionError('Failed to access camera and microphone. Please check your permissions.');
      }
    }
  };

  const joinCall = async () => {
    if (!roomId.trim()) return;
    
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setPermissionError(null);

    try {
      // Check HTTPS requirement
      if (!isHttps) {
        throw new Error('HTTPS_REQUIRED');
      }

      // Connect to signaling server first
      const ws = new WebSocket(SIGNALING_SERVER);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ 
          type: "join", 
          role: "receiver", 
          room: roomId,
          user: user?.name || 'Anonymous'
        }));
        setConnectionStatus('connected');
        setIsConnected(true);
        callStartTimeRef.current = Date.now();
        setIsConnecting(false);
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === "participant-joined") {
          setParticipants(prev => [...prev, message.user]);
        } else if (message.type === "participant-left") {
          setParticipants(prev => prev.filter(p => p !== message.user));
        } else if (message.type === "offer") {
          await handleOffer(message);
        } else if (message.type === "answer") {
          await handleAnswer(message);
        } else if (message.type === "candidate") {
          await handleCandidate(message);
        }
      };

    } catch (error: any) {
      console.error('Error joining call:', error);
      setConnectionStatus('error');
      setIsConnecting(false);
      
      // Handle specific permission errors
      if (error.name === 'NotAllowedError' || error.message === 'Permission denied by user') {
        setPermissionError('Camera and microphone access was denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No camera or microphone found. Please check your devices.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Camera or microphone is already in use by another application.');
      } else if (error.message === 'HTTPS_REQUIRED') {
        setPermissionError('HTTPS is required for camera and microphone access. Please use HTTPS or localhost.');
      } else {
        setPermissionError('Failed to access camera and microphone. Please check your permissions.');
      }
    }
  };

  const handleOffer = async (message: { sdp: RTCSessionDescriptionInit }) => {
    if (!pcRef.current) return;

    try {
      console.log('Handling offer...');
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Local video stream set in handleOffer:', stream);
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        pcRef.current!.addTrack(track, stream);
        console.log('Added track:', track.kind);
      });

      // Set remote description
      console.log('Setting remote description...');
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp));

      // Create and send answer
      console.log('Creating answer...');
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      
      console.log('Sending answer...');
      wsRef.current?.send(JSON.stringify({
        type: "answer",
        sdp: pcRef.current.localDescription,
        room: roomId
      }));
    } catch (error: any) {
      console.error('Error handling offer:', error);
      
      // Handle permission errors in offer handling
      if (error.name === 'NotAllowedError' || error.message === 'Permission denied by user') {
        setPermissionError('Camera and microphone access was denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No camera or microphone found. Please check your devices.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Camera or microphone is already in use by another application.');
      }
    }
  };

  const handleAnswer = async (message: { sdp: RTCSessionDescriptionInit }) => {
    if (!pcRef.current) return;
    
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleCandidate = async (message: { candidate: RTCIceCandidateInit }) => {
    if (!pcRef.current) return;
    
    try {
      await pcRef.current.addIceCandidate(message.candidate);
    } catch (error) {
      console.error('Error handling candidate:', error);
    }
  };

  const endCall = () => {
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('disconnected');
    setCallDuration(0);
    callStartTimeRef.current = 0;
    setParticipants([]);
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = async () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      screenStreamRef.current = screenStream;
      if (screenShareRef.current) {
        screenShareRef.current.srcObject = screenStream;
      }

      // Replace video track in peer connection
      if (pcRef.current && localStreamRef.current) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      setIsScreenSharing(true);

      // Handle screen share end
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

    } catch (error: any) {
      console.error('Error starting screen share:', error);
      
      // Handle screen share permission errors
      if (error.name === 'NotAllowedError' || error.message === 'Permission denied by user') {
        setPermissionError('Screen sharing permission was denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No screen sharing source found.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Screen sharing is not available or already in use.');
      }
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Restore camera
    if (pcRef.current && localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    }

    setIsScreenSharing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Please Login</h2>
          <p className="text-gray-400">You need to be logged in to access video calls</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Video Call</h1>
          </div>
          <div className="flex items-center space-x-4">
            {isConnected && (
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-400">
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
            )}
            {isConnected && (
              <div className="text-sm font-mono text-gray-400">
                {formatTime(callDuration)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {!isConnected ? (
          /* Pre-call Setup */
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold mb-4">Start or Join a Video Call</h2>
              <p className="text-gray-400 text-lg">
                Connect with creators and fans through high-quality video calls
              </p>
            </motion.div>

            {/* HTTPS Warning */}
            {!isHttps && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-red-600/20 border border-red-600/30 rounded-xl p-4"
              >
                <div className="flex items-center space-x-2 text-red-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="font-semibold">HTTPS Required</span>
                </div>
                <p className="text-red-300 text-sm mt-2">
                  Camera and microphone access requires HTTPS. Please use HTTPS or localhost to enable video calls.
                </p>
              </motion.div>
            )}

            {/* Permission Error */}
            {permissionError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-red-600/20 border border-red-600/30 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-red-400">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="font-semibold">Permission Error</span>
                  </div>
                  <button
                    onClick={() => setPermissionError(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
                <p className="text-red-300 text-sm mt-2">{permissionError}</p>
                <div className="mt-3 space-y-2">
                  <p className="text-red-200 text-xs">
                    <strong>To fix this:</strong>
                  </p>
                  <ul className="text-red-200 text-xs space-y-1 ml-4">
                    <li>• Click the camera/microphone icon in your browser&apos;s address bar</li>
                    <li>• Select &quot;Allow&quot; for camera and microphone access</li>
                    <li>• Refresh the page and try again</li>
                    <li>• Make sure no other application is using your camera/microphone</li>
                  </ul>
                </div>
              </motion.div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Start Call */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-green-400" />
                  <span>Start New Call</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Room ID
                    </label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter room ID..."
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-green-400"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isVideoEnabled}
                        onChange={(e) => setIsVideoEnabled(e.target.checked)}
                        className="rounded"
                      />
                      <span>Enable Video</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isAudioEnabled}
                        onChange={(e) => setIsAudioEnabled(e.target.checked)}
                        className="rounded"
                      />
                      <span>Enable Audio</span>
                    </label>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startCall}
                    disabled={!roomId.trim() || isConnecting || !isHttps}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isConnecting ? 'Starting...' : !isHttps ? 'HTTPS Required' : 'Start Call'}
                  </motion.button>
                </div>
              </motion.div>

              {/* Join Call */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Join Existing Call</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Room ID
                    </label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter room ID..."
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isVideoEnabled}
                        onChange={(e) => setIsVideoEnabled(e.target.checked)}
                        className="rounded"
                      />
                      <span>Enable Video</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isAudioEnabled}
                        onChange={(e) => setIsAudioEnabled(e.target.checked)}
                        className="rounded"
                      />
                      <span>Enable Audio</span>
                    </label>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={joinCall}
                    disabled={!roomId.trim() || isConnecting || !isHttps}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isConnecting ? 'Joining...' : !isHttps ? 'HTTPS Required' : 'Join Call'}
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Room Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/30 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-semibold mb-3">Share Room Code</h3>
              <div className="flex items-center space-x-3">
                <div className="bg-gray-700 px-4 py-2 rounded-lg font-mono text-lg font-bold">
                  {roomCode}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyRoomCode}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Call Interface */
          <div className="space-y-6">
            {/* Video Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Local Video */}
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">You ({user.name})</span>
                  <div className="flex items-center space-x-2">
                    {!isVideoEnabled && <VideoOff className="w-4 h-4 text-red-400" />}
                    {!isAudioEnabled && <MicOff className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="w-full h-64 bg-black object-cover"
                  onLoadedMetadata={() => console.log('Local video loaded')}
                  onError={(e) => console.error('Local video error:', e)}
                />
              </div>

              {/* Remote Video */}
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Remote Participant</span>
                </div>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  controls={false}
                  className="w-full h-64 bg-black object-cover"
                  onLoadedMetadata={() => console.log('Remote video loaded')}
                  onError={(e) => console.error('Remote video error:', e)}
                />
              </div>
            </div>

            {/* Screen Share */}
            {isScreenSharing && (
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Screen Share</span>
                </div>
                <video
                  ref={screenShareRef}
                  autoPlay
                  playsInline
                  className="w-full h-96 bg-black"
                />
              </div>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Participants ({participants.length + 1})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                    {user.name} (You)
                  </div>
                  {participants.map((participant, index) => (
                    <div key={index} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {participant}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleAudio}
                  className={`p-3 rounded-full transition-colors ${
                    isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className={`p-3 rounded-full transition-colors ${
                    isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <Monitor className="w-6 h-6" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={endCall}
                  className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRTCPage;
