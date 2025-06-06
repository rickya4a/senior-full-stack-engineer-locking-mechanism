import { WebSocketMessage, CursorPosition } from '../types';
import validator from 'validator';
import { Lock } from '../generated/prisma';

interface SanitizeError {
  isValid: false;
  error: string;
}

interface SanitizeSuccess {
  isValid: true;
  data: WebSocketMessage;
}

type SanitizeResult = SanitizeError | SanitizeSuccess;

const sanitizeCursorPosition = (data: any): data is CursorPosition => {
  if (!data || typeof data !== 'object') return false;

  // Validate required fields
  if (typeof data.x !== 'number' || typeof data.y !== 'number') return false;
  if (typeof data.userId !== 'string' || !validator.isUUID(data.userId)) return false;
  if (typeof data.userName !== 'string') return false;
  if (typeof data.appointmentId !== 'string' || !validator.isUUID(data.appointmentId)) return false;

  // Sanitize strings
  data.userName = validator.escape(data.userName);

  // Ensure coordinates are within reasonable bounds
  if (data.x < 0 || data.x > 10000 || data.y < 0 || data.y > 10000) return false;

  return true;
};

const sanitizeLock = (data: any): data is Lock => {
  if (!data || typeof data !== 'object') return false;

  // Validate required fields
  if (typeof data.userId !== 'string' || !validator.isUUID(data.userId)) return false;
  if (typeof data.appointmentId !== 'string' || !validator.isUUID(data.appointmentId)) return false;
  if (!(data.expiresAt instanceof Date)) return false;

  // Validate user object if present
  if (data.user) {
    if (typeof data.user !== 'object') return false;
    if (typeof data.user.name !== 'string') return false;
    if (typeof data.user.email !== 'string' || !validator.isEmail(data.user.email)) return false;

    // Sanitize user data
    data.user.name = validator.escape(data.user.name);
    data.user.email = validator.escape(data.user.email);
  }

  return true;
};

export const sanitizeWebSocketMessage = (message: any): SanitizeResult => {
  try {
    // Basic structure validation
    if (!message || typeof message !== 'object') {
      return { isValid: false, error: 'Invalid message format' };
    }

    // Validate message type
    if (!message.type || !['LOCK_ACQUIRED', 'LOCK_RELEASED', 'CURSOR_MOVE'].includes(message.type)) {
      return { isValid: false, error: 'Invalid message type' };
    }

    // Validate appointmentId
    if (!message.appointmentId || !validator.isUUID(message.appointmentId)) {
      return { isValid: false, error: 'Invalid appointment ID' };
    }

    // Validate token if present
    if (message.token && typeof message.token === 'string') {
      message.token = validator.escape(message.token);
    }

    // Type-specific validation
    if (message.type === 'CURSOR_MOVE') {
      if (!sanitizeCursorPosition(message.data)) {
        return { isValid: false, error: 'Invalid cursor position data' };
      }
    } else if (message.type === 'LOCK_ACQUIRED') {
      if (!sanitizeLock(message.data)) {
        return { isValid: false, error: 'Invalid lock data' };
      }
    } else if (message.type === 'LOCK_RELEASED' && message.data !== null) {
      return { isValid: false, error: 'Lock released message should have null data' };
    }

    return { isValid: true, data: message };
  } catch (error) {
    return { isValid: false, error: 'Message sanitization failed' };
  }
};