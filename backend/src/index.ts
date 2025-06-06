import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import WebSocket from 'ws';
import http from 'http';
import lockRoutes from './routes/lockRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import authRoutes from './routes/authRoutes';
import { rateLimiter } from './middlewares/rateLimiter';
import { WebSocketMessage } from './types';

config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Apply rate limiting to all routes
app.use(rateLimiter);

// Routes
app.use('/api', authRoutes);
app.use('/api', lockRoutes);
app.use('/api', appointmentRoutes);

// WebSocket handling
const clients = new Map<string, WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(7);
  clients.set(clientId, ws);

  ws.on('message', (message: string) => {
    try {
      const data: WebSocketMessage = JSON.parse(message);

      // Broadcast to all clients except sender
      clients.forEach((client, id) => {
        if (id !== clientId && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});