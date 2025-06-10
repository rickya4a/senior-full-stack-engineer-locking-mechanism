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

export type WebSocketMessageType = 'LOCK_ACQUIRED' | 'LOCK_RELEASED' | 'CURSOR_MOVE' | 'ERROR' | 'APPOINTMENT_UPDATED' | 'APPOINTMENT_CREATED' | 'APPOINTMENT_DELETED';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  appointmentId: string;
  data: Lock | CursorPosition | null;
  message?: string;
  token?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LockAudit {
  id: string;
  action: string;
  admin: {
    name: string;
    email: string;
  };
  targetUser: {
    name: string;
    email: string;
  };
  appointment: {
    title: string;
  };
  reason?: string;
  createdAt: string;
}