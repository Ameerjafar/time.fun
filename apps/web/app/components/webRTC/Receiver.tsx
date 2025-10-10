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

  useEffect(() => {
    async function init() {
      setStatus("connecting-ws");
      const ws = new WebSocket(SIGNALING_SERVER);
      wsRef.current = ws;

      ws.onopen = async () => {
        ws.send(JSON.stringify({ type: "join", role: "receiver", room }));
        setStatus("ws-open");

        const pc = new RTCPeerConnection(STUN_CONFIG);
        pcRef.current = pc;

        pc.ontrack = (ev) => {
          if (remoteVideoRef.current) {
            if (!remoteVideoRef.current.srcObject) remoteVideoRef.current.srcObject = new MediaStream();
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

    return () => {
      pcRef.current?.close();
      wsRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Receiver</h1>
      <div style={{ display: "flex", gap: 12 }}>
        <div>
          <div>Local</div>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: 320, height: 240, background: "#000" }} />
        </div>
        <div>
          <div>Remote</div>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 320, height: 240, background: "#000" }} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}
