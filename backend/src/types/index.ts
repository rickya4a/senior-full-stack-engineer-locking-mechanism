import { User, Appointment, Lock } from '../generated/prisma'

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: UserPayload;
}

export interface LockResponse {
  success: boolean;
  message: string;
  lock?: Lock & {
    user: User;
  };
}

export interface AppointmentWithLock extends Appointment {
  lock?: Lock & {
    user: User;
  };
}

export interface WebSocketMessage {
  type: 'LOCK_ACQUIRED' | 'LOCK_RELEASED' | 'CURSOR_MOVE';
  appointmentId: string;
  data: any;
}