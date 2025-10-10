import express from "express";
import http from "http";
import WebSocket, { Server as WSServer } from "ws";
import cors from "cors";

type Role = "sender" | "receiver";
type SignalMessage =
  | { type: "join"; role: Role; room: string }
  | { type: "offer"; sdp: any; room: string }
  | { type: "answer"; sdp: any; room: string }
  | { type: "candidate"; candidate: any; room: string }
  | { type: "leave"; room: string };

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WSServer({ server });

const rooms = new Map<
  string,
  {
    sender?: WebSocket;
    receiver?: WebSocket;
    timeout?: NodeJS.Timeout;
  }
>();

function safeSend(ws: WebSocket | undefined, data: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(data));
}

wss.on("connection", (ws: WebSocket) => {
  let joinedRoom: string | null = null;
  let joinedRole: Role | null = null;

  ws.on("message", (raw) => {
    try {
      const msg: SignalMessage = JSON.parse(raw.toString());

      if (msg.type === "join") {
        const { room, role } = msg;
        joinedRoom = room;
        joinedRole = role;

        if (!rooms.has(room)) rooms.set(room, {});
        const entry = rooms.get(room)!;

        if (entry.timeout) {
          clearTimeout(entry.timeout);
          entry.timeout = undefined;
          console.log(`[cleanup] Cancelled scheduled deletion for room=${room}`);
        }

        if (role === "sender") {
          entry.sender = ws;
        } else {
          entry.receiver = ws;
        }

        console.log(`[ws] join room=${room} role=${role}`);

        safeSend(entry.sender, {
          type: "peer-status",
          peer: !!entry.receiver ? "connected" : "waiting",
        });
        safeSend(entry.receiver, {
          type: "peer-status",
          peer: !!entry.sender ? "connected" : "waiting",
        });
        return;
      }

      if (!msg.room) return;
      const entry = rooms.get(msg.room);
      if (!entry) return;

      switch (msg.type) {
        case "offer":
          console.log(`[ws] forward offer room=${msg.room}`);
          safeSend(entry.receiver, { type: "offer", sdp: msg.sdp });
          break;
        case "answer":
          console.log(`[ws] forward answer room=${msg.room}`);
          safeSend(entry.sender, { type: "answer", sdp: msg.sdp });
          break;
        case "candidate":
          console.log(`[ws] forward candidate room=${msg.room}`);
          if (ws === entry.sender)
            safeSend(entry.receiver, { type: "candidate", candidate: msg.candidate });
          else
            safeSend(entry.sender, { type: "candidate", candidate: msg.candidate });
          break;
        case "leave":
          console.log(`[ws] leave room=${msg.room}`);
          if (entry.sender === ws) entry.sender = undefined;
          if (entry.receiver === ws) entry.receiver = undefined;
          safeSend(entry.sender, { type: "leave" });
          safeSend(entry.receiver, { type: "leave" });
          break;
      }
    } catch (err) {
      console.error("ws msg parse error", err);
    }
  });

  ws.on("close", () => {
    if (!joinedRoom) return;
    const entry = rooms.get(joinedRoom);
    if (!entry) return;

    if (joinedRole === "sender" && entry.sender === ws) entry.sender = undefined;
    if (joinedRole === "receiver" && entry.receiver === ws) entry.receiver = undefined;

    safeSend(entry.sender, { type: "leave" });
    safeSend(entry.receiver, { type: "leave" });

    console.log(`[ws] closed room=${joinedRoom} role=${joinedRole}`);
    if (!entry.sender && !entry.receiver) {
      console.log(`[cleanup] Scheduling deletion for room=${joinedRoom} after 2 minutes`);
      entry.timeout = setTimeout(() => {
        rooms.delete(joinedRoom!);
        console.log(`[cleanup] Deleted inactive room=${joinedRoom}`);
      }, 2 * 60 * 1000);
    }
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
server.listen(PORT, () => {
  console.log(`Signaling server listening on http://localhost:${PORT}`);
});
