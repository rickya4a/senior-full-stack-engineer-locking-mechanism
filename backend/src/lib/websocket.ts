import WebSocket from 'ws';
import { WebSocketMessage } from '../types';

let wss: WebSocket.Server;

export const initializeWebSocket = (server: any) => {
  wss = new WebSocket.Server({ server, path: '/' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message) as WebSocketMessage;
        console.log('Received message:', data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send initial ping to verify connection
    ws.send(JSON.stringify({ type: 'CONNECTED' }));
  });
};

export const broadcastMessage = (message: WebSocketMessage) => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  console.log('Broadcasting message:', message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};