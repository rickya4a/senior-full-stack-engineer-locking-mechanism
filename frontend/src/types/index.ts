export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface Lock {
  id: string;
  appointmentId: string;
  userId: string;
  expiresAt: Date;
  user: User;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  lock?: Lock;
}

export interface CursorPosition {
  x: number;
  y: number;
  appointmentId: string;
  userId: string;
  userName: string;
}

export type WebSocketMessageType = 'LOCK_ACQUIRED' | 'LOCK_RELEASED' | 'CURSOR_MOVE';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  appointmentId: string;
  data: Lock | CursorPosition | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}