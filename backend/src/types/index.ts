import { User, Lock } from '../generated/prisma';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginResponse {
  token: string;
  user: UserPayload;
}

export interface LockResponse {
  success: boolean;
  message: string;
  lock?: Lock & { user: User };
}

export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  appointmentId: string;
}

export interface WebSocketMessage {
  type: 'LOCK_ACQUIRED' | 'LOCK_RELEASED' | 'CURSOR_MOVE' | 'ERROR';
  appointmentId: string;
  data: Lock | CursorPosition | null;
  message?: string;
  token?: string;
}