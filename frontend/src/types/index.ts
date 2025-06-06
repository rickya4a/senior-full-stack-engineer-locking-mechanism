export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AppointmentLock {
  appointmentId: string;
  userId: string;
  user: User;
  expiresAt: Date;
}

export interface Appointment {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  createdBy: string;
  lock?: AppointmentLock;
}

export interface AuthResponse {
  user: User;
  token: string;
}