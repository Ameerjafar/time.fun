import WebSocket from "ws";

export interface MessageServiceParams {
  event: any;
  ws: WebSocket;
}
