import WebSocket from 'ws';
import { WebSocketMessage } from '../types';

let wss: WebSocket.Server;

export const initializeWebSocket = (server: any) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};

export const broadcastMessage = (message: WebSocketMessage) => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};