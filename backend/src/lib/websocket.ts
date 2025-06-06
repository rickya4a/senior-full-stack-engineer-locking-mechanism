import WebSocket from 'ws';
import { WebSocketMessage } from '../types';
import { isRateLimited } from '../middlewares/wsRateLimiter';
import { sanitizeWebSocketMessage } from '../middlewares/wsSanitizer';
import jwt from 'jsonwebtoken';

let wss: WebSocket.Server;

export const initializeWebSocket = (server: any) => {
  wss = new WebSocket.Server({ server, path: '/' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    let userId: string | undefined;

    ws.on('message', (message: string) => {
      try {
        const rawData = JSON.parse(message);

        // Extract user ID from token if available
        if (!userId && rawData.token) {
          try {
            const decoded = jwt.verify(rawData.token, process.env.JWT_SECRET!) as { id: string };
            userId = decoded.id;
          } catch (error) {
            console.error('Invalid token in WebSocket message');
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'Invalid authentication token'
            }));
            return;
          }
        }

        // Apply rate limiting if we have a user ID
        if (userId && isRateLimited(userId)) {
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Rate limit exceeded for WebSocket messages'
          }));
          return;
        }

        // Sanitize and validate the message
        const sanitizeResult = sanitizeWebSocketMessage(rawData);
        if (!sanitizeResult.isValid) {
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: sanitizeResult.error
          }));
          return;
        }

        const data = sanitizeResult.data;
        console.log('Received message:', data);

        // Broadcast cursor move messages to all clients
        if (data.type === 'CURSOR_MOVE') {
          broadcastMessage(data);
        }
      } catch (error) {
        console.error('Failed to parse or process message:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Invalid message format'
        }));
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