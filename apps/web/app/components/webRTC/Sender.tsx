"use client";
import { useEffect, useRef, useState } from "react";

const SIGNALING_SERVER = "ws://localhost:8080";
const STUN_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function Sender() {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [room] = useState<string>("room1");
  const [time, setTime] = useState<number>(0);
  const [status, setStatus] = useState<string>("initializing");

  useEffect(() => {
    async function init() {
      setStatus("getting-media");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      setStatus("connecting-ws");
      const ws = new WebSocket(SIGNALING_SERVER);
      wsRef.current = ws;

      ws.onopen = async () => {
        ws.send(JSON.stringify({ type: "join", role: "sender", room }));
        setStatus("ws-open");
        const pc = new RTCPeerConnection(STUN_CONFIG);
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (ev) => {
          if (remoteVideoRef.current) {
            if (!remoteVideoRef.current.srcObject) {
              remoteVideoRef.current.srcObject = new MediaStream();
            }
            const remoteStream = remoteVideoRef.current
              .srcObject as MediaStream;
            ev.track && remoteStream.addTrack(ev.track);
          }
        };
        pc.onicecandidate = (ev) => {
          if (ev.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "candidate",
                candidate: ev.candidate,
                room,
              })
            );
          }
        };
        pc.onconnectionstatechange = () =>
          setStatus(`pc: ${pc.connectionState}`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(
          JSON.stringify({ type: "offer", sdp: pc.localDescription, room })
        );
        setStatus("offer-sent");
      };

      ws.onmessage = async (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.type === "answer") {
          await pcRef.current?.setRemoteDescription(
            new RTCSessionDescription(msg.sdp)
          );
          setStatus("remote-desc-set");
        } else if (msg.type === "candidate") {
          try {
            await pcRef.current?.addIceCandidate(msg.candidate);
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

  useEffect(() => {
    setInterval(() => {
      pcRef.current?.close();
      wsRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    }, 1000 * 60)
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Sender</h1>
      <div style={{ display: "flex", gap: 12 }}>
        <div>
          <div>Local</div>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 320, height: 240, background: "#000" }}
          />
        </div>
        <div>
          <div>Remote</div>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: 320, height: 240, background: "#000" }}
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}
