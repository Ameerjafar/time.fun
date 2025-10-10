"use client";
import { useEffect, useRef, useState } from "react";

const SIGNALING_SERVER = "ws://localhost:8080";
const STUN_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function Receiver() {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [room] = useState<string>("room1");
  const [status, setStatus] = useState<string>("initializing");
  const [timeLeft, setTimeLeft] = useState<number>(60); // 60-second session

  // ✅ WebRTC + WebSocket setup
  useEffect(() => {
    async function init() {
      setStatus("connecting-ws");
      const ws = new WebSocket(SIGNALING_SERVER);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", role: "receiver", room }));
        setStatus("ws-open");

        const pc = new RTCPeerConnection(STUN_CONFIG);
        pcRef.current = pc;

        pc.ontrack = (ev) => {
          if (remoteVideoRef.current) {
            if (!remoteVideoRef.current.srcObject) {
              remoteVideoRef.current.srcObject = new MediaStream();
            }
            const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
            ev.track && remoteStream.addTrack(ev.track);
          }
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "candidate", candidate: ev.candidate, room }));
          }
        };

        pc.onconnectionstatechange = () => setStatus(`pc: ${pc.connectionState}`);
      };

      ws.onmessage = async (ev) => {
        const msg = JSON.parse(ev.data);
        const pc = pcRef.current!;
        if (msg.type === "offer") {
          setStatus("offer-received");

          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsRef.current?.send(JSON.stringify({ type: "answer", sdp: pc.localDescription, room }));
          setStatus("answer-sent");
        } else if (msg.type === "candidate") {
          try {
            await pc.addIceCandidate(msg.candidate);
          } catch (err) {
            console.warn("addIceCandidate error", err);
          }
        }
      };
    }

    init();

    // ✅ Auto-close connection after 1 minute
    const cleanupInterval = setInterval(() => {
      pcRef.current?.close();
      wsRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    }, 1000 * 60);

    return () => {
      clearInterval(cleanupInterval);
      pcRef.current?.close();
      wsRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          pcRef.current?.close();
          wsRef.current?.close();
          localStreamRef.current?.getTracks().forEach((t) => t.stop());
          setStatus("session-ended");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-5 relative">
      <h1 className="text-2xl font-bold mb-4">Receiver</h1>

      <div className="flex gap-3">
        <div>
          <div className="mb-1 font-semibold">Local</div>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-80 h-60 bg-black" />
        </div>
        <div>
          <div className="mb-1 font-semibold">Remote</div>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-80 h-60 bg-black" />
        </div>
      </div>
      <div className="mt-3 font-medium">
        <strong>Status:</strong> {status}
      </div>
      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg font-mono text-sm">
        ⏱ {formatTime(timeLeft)}
      </div>
    </div>
  );
}
