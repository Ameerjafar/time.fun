import WebSocket from "ws";
import { RedisClient } from "@cache/db";
import { flushBatchToDB } from "./services/flushDB";
const redis_url = process.env.REDIS_URL!;
const redis = new RedisClient(redis_url);
redis.connect();
const wss = new WebSocket.Server({ port: 8080 });

const peerToPeerConnection = new Map<string, WebSocket>();
const groupConnection = new Map<string, WebSocket[]>();
let messageBatch: any[] = [];
wss.on("connection", async (ws: WebSocket) => {
  console.log("socket Connection established");
  ws.on("message", async (event: WebSocket.Data) => {
    const parseData = JSON.parse(event as string);
    if (parseData.type === "P2PMESSAGE" || parseData.type === "GROUPMESSAGE") {
      await redis.publish("chatChannel", JSON.stringify(parseData));
    }

    if (parseData.type === "connection") {
      let name = parseData.name;
      peerToPeerConnection.set(name, ws);
      console.log(peerToPeerConnection);
    }
  });
  ws.on("close", () => {
    for (const [name, socket] of peerToPeerConnection.entries()) {
      if (socket === ws) {
        peerToPeerConnection.delete(name);
      }
    }
    for (const [name, sockets] of groupConnection.entries()) {
      const afterSocket: WebSocket[] = [];
      sockets.forEach((socket: WebSocket) => {
        if (socket !== ws) {
          afterSocket.push(socket);
        }
      });
      groupConnection.set(name, afterSocket);
    }
  });
});

await redis.subscribe("chatChannel", (message: any) => {
  const parseData = JSON.parse(message);
  parseData.date = new Date();
  messageBatch.push(parseData);
  if (messageBatch.length >= 10) {
    flushBatchToDB(messageBatch);
  }
  if (parseData.type === "P2PMESSAGE") {
    console.log("hello");
    wss.clients.forEach((connection: WebSocket) => {
      const getWs = peerToPeerConnection.get(parseData.to);
      if (getWs === connection) {
        connection.send(parseData.data);
      }
    });
  } else if (parseData.type === "GROUPMESSAGE") {
    const groupName = parseData.groupName;
    const data = parseData.data;
    groupConnection.get(groupName)?.forEach((ws: WebSocket) => {
      ws.send(data);
    });
  }
});

setInterval(() => {
  if (messageBatch.length > 0) {
    flushBatchToDB(messageBatch);
    messageBatch = [];
  }
}, 1000 * 10);
wss.on("error", (error: unknown) => console.log("got this error", error));
wss.on("close", () => console.log("websocket server is closed now"));
