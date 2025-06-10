import { WebSocketMessage } from '@/types';
import Cookies from 'js-cookie';

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private messageHandlers: Set<MessageHandler> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectTimeout = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        console.log('Received message:', data);
        if (data.type === 'ERROR') {
          console.error('WebSocket error:', data.message);
          return;
        }
        this.messageHandlers.forEach(handler => handler(data));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.connect();
        this.reconnectAttempts++;
        this.reconnectTimeout *= 2;
      }, this.reconnectTimeout);
    }
  }

  public subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const token = Cookies.get('token');
      this.ws.send(JSON.stringify({
        ...message,
        token
      }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}

export const wsService = new WebSocketService();