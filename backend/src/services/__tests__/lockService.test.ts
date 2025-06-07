import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LockService } from '../lockService';
import prisma from '../../lib/prisma';
import { Lock, User } from '../../generated/prisma';
import { broadcastMessage } from '../../lib/websocket';

// Mock prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    appointment: {
      findUnique: jest.fn(),
    },
    lock: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock websocket broadcast
jest.mock('../../lib/websocket', () => ({
  broadcastMessage: jest.fn(),
}));

describe('LockService', () => {
  const mockUserId = 'user-123';
  const mockAppointmentId = 'appointment-123';
  const mockUser: User = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaClient = prisma as unknown as {
    appointment: { findUnique: jest.Mock };
    lock: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockPrismaClient.appointment.findUnique.mockImplementation(() => Promise.resolve(null));
    mockPrismaClient.lock.create.mockImplementation(() => Promise.resolve(null));
    mockPrismaClient.lock.update.mockImplementation(() => Promise.resolve(null));
    mockPrismaClient.lock.delete.mockImplementation(() => Promise.resolve(null));
    mockPrismaClient.lock.findUnique.mockImplementation(() => Promise.resolve(null));
    (broadcastMessage as jest.Mock).mockClear();
  });

  describe('acquireLock', () => {
    it('should acquire lock when appointment exists and no current lock', async () => {
      // Mock appointment without lock
      mockPrismaClient.appointment.findUnique.mockImplementation(() =>
        Promise.resolve({
          id: mockAppointmentId,
          lock: null,
        })
      );

      // Mock lock creation
      const mockLock: Lock = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 5 * 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaClient.lock.create.mockImplementation(() =>
        Promise.resolve({
          ...mockLock,
          user: mockUser,
        })
      );

      const result = await LockService.acquireLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock acquired successfully');
      expect(result.lock).toBeDefined();
      expect(result.lock?.userId).toBe(mockUserId);
    });

    it('should fail to acquire lock when appointment is already locked', async () => {
      const existingLock: Lock = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: 'other-user-123',
        expiresAt: new Date(Date.now() + 60000), // Not expired
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.appointment.findUnique.mockImplementation(() =>
        Promise.resolve({
          id: mockAppointmentId,
          lock: {
            ...existingLock,
            user: {
              ...mockUser,
              id: 'other-user-123',
            },
          },
        })
      );

      const result = await LockService.acquireLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Appointment is locked by another user');
      expect(result.lock).toBeDefined();
      expect(result.lock?.userId).toBe('other-user-123');
    });

    it('should acquire lock when existing lock is expired', async () => {
      const expiredLock: Lock = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: 'other-user-123',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.appointment.findUnique.mockImplementation(() =>
        Promise.resolve({
          id: mockAppointmentId,
          lock: {
            ...expiredLock,
            user: {
              ...mockUser,
              id: 'other-user-123',
            },
          },
        })
      );

      // Mock lock deletion and creation
      mockPrismaClient.lock.delete.mockImplementation(() => Promise.resolve(expiredLock));
      mockPrismaClient.lock.create.mockImplementation(() =>
        Promise.resolve({
          id: 'new-lock-123',
          appointmentId: mockAppointmentId,
          userId: mockUserId,
          expiresAt: new Date(Date.now() + 5 * 60000),
          createdAt: new Date(),
          updatedAt: new Date(),
          user: mockUser,
        })
      );

      const result = await LockService.acquireLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock acquired successfully');
      expect(result.lock).toBeDefined();
      expect(result.lock?.userId).toBe(mockUserId);
    });

    it('should extend lock when user already owns it', async () => {
      const existingLock: Lock = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.appointment.findUnique.mockImplementation(() =>
        Promise.resolve({
          id: mockAppointmentId,
          lock: {
            ...existingLock,
            user: mockUser,
          },
        })
      );

      // Mock lock extension
      mockPrismaClient.lock.update.mockImplementation(() =>
        Promise.resolve({
          ...existingLock,
          expiresAt: new Date(Date.now() + 5 * 60000),
          user: mockUser,
        })
      );

      const result = await LockService.acquireLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock extended');
      expect(result.lock).toBeDefined();
      expect(result.lock?.userId).toBe(mockUserId);
    });

    it('should fail when appointment does not exist', async () => {
      mockPrismaClient.appointment.findUnique.mockImplementation(() => Promise.resolve(null));

      const result = await LockService.acquireLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Appointment not found');
      expect(result.lock).toBeUndefined();
    });
  });

  describe('releaseLock', () => {
    it('should successfully release owned lock', async () => {
      const existingLock: Lock = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.lock.findUnique.mockImplementation(() =>
        Promise.resolve({
          ...existingLock,
          user: mockUser,
        })
      );
      mockPrismaClient.lock.delete.mockImplementation(() => Promise.resolve(existingLock));

      const result = await LockService.releaseLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock released successfully');
    });

    it('should fail to release lock owned by another user', async () => {
      const existingLock: Lock = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: 'other-user-123',
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.lock.findUnique.mockImplementation(() =>
        Promise.resolve({
          ...existingLock,
          user: {
            ...mockUser,
            id: 'other-user-123',
          },
        })
      );

      const result = await LockService.releaseLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Not authorized to release this lock');
    });

    it('should handle non-existent lock gracefully', async () => {
      mockPrismaClient.lock.findUnique.mockImplementation(() => Promise.resolve(null));

      const result = await LockService.releaseLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No lock found');
    });
  });

  describe('getLockStatus', () => {
    it('should return not locked when no lock exists', async () => {
      mockPrismaClient.lock.findUnique.mockImplementation(() => Promise.resolve(null));

      const result = await LockService.getLockStatus(mockAppointmentId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Appointment is not locked');
      expect(result.lock).toBeUndefined();
    });

    it('should return locked status with lock details when valid lock exists', async () => {
      const mockLock: Lock & { user: User } = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      mockPrismaClient.lock.findUnique.mockImplementation(() => Promise.resolve(mockLock));

      const result = await LockService.getLockStatus(mockAppointmentId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Appointment is locked');
      expect(result.lock).toEqual(mockLock);
    });

    it('should release and return not locked when lock is expired', async () => {
      const expiredLock: Lock & { user: User } = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: mockUserId,
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      mockPrismaClient.lock.findUnique.mockImplementation(() => Promise.resolve(expiredLock));
      mockPrismaClient.lock.delete.mockImplementation(() => Promise.resolve(expiredLock));

      const result = await LockService.getLockStatus(mockAppointmentId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Appointment is not locked');
      expect(result.lock).toBeUndefined();
      expect(mockPrismaClient.lock.delete).toHaveBeenCalledWith({
        where: { appointmentId: mockAppointmentId }
      });
      expect(broadcastMessage).toHaveBeenCalledWith({
        type: 'LOCK_RELEASED',
        appointmentId: mockAppointmentId,
        data: null
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaClient.lock.findUnique.mockImplementation(() =>
        Promise.reject(new Error('Database error'))
      );

      const result = await LockService.getLockStatus(mockAppointmentId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to get lock status');
    });
  });

  describe('error handling', () => {
    it('should handle database errors in acquireLock', async () => {
      mockPrismaClient.appointment.findUnique.mockImplementation(() =>
        Promise.reject(new Error('Database error'))
      );

      const result = await LockService.acquireLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to acquire lock');
    });

    it('should handle database errors in releaseLock', async () => {
      mockPrismaClient.lock.findUnique.mockImplementation(() =>
        Promise.reject(new Error('Database error'))
      );

      const result = await LockService.releaseLock(mockAppointmentId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to release lock');
    });
  });

  describe('websocket broadcasts', () => {
    it('should broadcast lock acquired message when lock is created', async () => {
      const mockLock: Lock & { user: User } = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      mockPrismaClient.appointment.findUnique.mockImplementation(() =>
        Promise.resolve({ id: mockAppointmentId, lock: null })
      );
      mockPrismaClient.lock.create.mockImplementation(() => Promise.resolve(mockLock));

      await LockService.acquireLock(mockAppointmentId, mockUserId);

      expect(broadcastMessage).toHaveBeenCalledWith({
        type: 'LOCK_ACQUIRED',
        appointmentId: mockAppointmentId,
        data: mockLock
      });
    });

    it('should broadcast lock released message when lock is released', async () => {
      const mockLock: Lock & { user: User } = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      mockPrismaClient.lock.findUnique.mockImplementation(() => Promise.resolve(mockLock));
      mockPrismaClient.lock.delete.mockImplementation(() => Promise.resolve(mockLock));

      await LockService.releaseLock(mockAppointmentId, mockUserId);

      expect(broadcastMessage).toHaveBeenCalledWith({
        type: 'LOCK_RELEASED',
        appointmentId: mockAppointmentId,
        data: null
      });
    });

    it('should broadcast lock acquired message when lock is extended', async () => {
      const mockLock: Lock & { user: User } = {
        id: 'lock-123',
        appointmentId: mockAppointmentId,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      mockPrismaClient.appointment.findUnique.mockImplementation(() =>
        Promise.resolve({ id: mockAppointmentId, lock: mockLock })
      );
      mockPrismaClient.lock.update.mockImplementation(() => Promise.resolve(mockLock));

      await LockService.acquireLock(mockAppointmentId, mockUserId);

      expect(broadcastMessage).toHaveBeenCalledWith({
        type: 'LOCK_ACQUIRED',
        appointmentId: mockAppointmentId,
        data: mockLock
      });
    });
  });
});