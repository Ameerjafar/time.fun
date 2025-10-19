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
  Settings, 
  Users, 
  Share2, 
  Monitor,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SIGNALING_SERVER = "ws://localhost:8080";
const STUN_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ],
};

const VideoReceiver = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomId, setRoomId] = useState('room1');
  const [participants, setParticipants] = useState<string[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [callDuration, setCallDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60-second session limit
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

  // Call duration timer and HTTPS check
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && callStartTimeRef.current > 0) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    // Check if running on HTTPS
    setIsHttps(window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  }, []);

  // Session timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnected) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setIsConnecting(false);
      };

      // Create peer connection
      const pc = new RTCPeerConnection(STUN_CONFIG);
      pcRef.current = pc;

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

  const handleOffer = async (message: any) => {
    if (!pcRef.current) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        pcRef.current!.addTrack(track, stream);
      });

      // Set remote description
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp));

      // Create and send answer
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      
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

  const handleAnswer = async (message: any) => {
    if (!pcRef.current) return;
    
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleCandidate = async (message: any) => {
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
    setTimeLeft(60);
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
            <h1 className="text-2xl font-bold">Video Call - Receiver</h1>
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
            {isConnected && (
              <div className="bg-red-600/20 text-red-400 px-3 py-1 rounded-lg text-sm font-mono">
                ⏱ {formatTime(timeLeft)}
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
              <h2 className="text-3xl font-bold mb-4">Join Video Call</h2>
              <p className="text-gray-400 text-lg">
                Join an existing video call session as a receiver
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 max-w-md mx-auto"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Join Settings</span>
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
                <div className="flex space-x-4">
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
                <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Receiver sessions are limited to 60 seconds
                  </p>
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

export default VideoReceiver;