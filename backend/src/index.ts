import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import http from 'http';
import lockRoutes from './routes/lockRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import authRoutes from './routes/authRoutes';
import { rateLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/logger';
import { initializeWebSocket } from './lib/websocket';

config();

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Routes
app.use('/api', authRoutes);
app.use('/api', lockRoutes);
app.use('/api', appointmentRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});