import prisma from '../lib/prisma';
import { LockResponse, WebSocketMessage } from '../types';
import { broadcastMessage } from '../lib/websocket';

export class LockService {
  private static LOCK_EXPIRY_MINUTES = parseInt(process.env.LOCK_EXPIRY_MINUTES || '5');

  static async acquireLock(appointmentId: string, userId: string): Promise<LockResponse> {
    try {
      // Check if appointment exists
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { lock: { include: { user: true } } }
      });

      if (!appointment) {
        return { success: false, message: 'Appointment not found' };
      }

      // Check if there's an existing lock
      if (appointment.lock) {
        // Check if lock has expired
        if (new Date() > appointment.lock.expiresAt) {
          // Release expired lock
          await this.releaseLock(appointmentId);
        } else if (appointment.lock.userId !== userId) {
          return {
            success: false,
            message: 'Appointment is locked by another user',
            lock: appointment.lock
          };
        } else {
          // Extend existing lock
          const updatedLock = await this.extendLock(appointmentId);
          return {
            success: true,
            message: 'Lock extended',
            lock: updatedLock
          };
        }
      }

      // Create new lock
      const lock = await prisma.lock.create({
        data: {
          appointmentId,
          userId,
          expiresAt: new Date(Date.now() + this.LOCK_EXPIRY_MINUTES * 60000)
        },
        include: { user: true }
      });

      // Broadcast lock acquired message
      const message: WebSocketMessage = {
        type: 'LOCK_ACQUIRED',
        appointmentId,
        data: lock
      };
      broadcastMessage(message);

      return {
        success: true,
        message: 'Lock acquired successfully',
        lock
      };
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return { success: false, message: 'Failed to acquire lock' };
    }
  }

  static async releaseLock(appointmentId: string, userId?: string): Promise<LockResponse> {
    try {
      const lock = await prisma.lock.findUnique({
        where: { appointmentId },
        include: { user: true }
      });

      if (!lock) {
        return { success: false, message: 'No lock found' };
      }

      if (userId && lock.userId !== userId) {
        return { success: false, message: 'Not authorized to release this lock' };
      }

      await prisma.lock.delete({
        where: { appointmentId }
      });

      // Broadcast lock released message
      const message: WebSocketMessage = {
        type: 'LOCK_RELEASED',
        appointmentId,
        data: null
      };
      broadcastMessage(message);

      return { success: true, message: 'Lock released successfully' };
    } catch (error) {
      console.error('Error releasing lock:', error);
      return { success: false, message: 'Failed to release lock' };
    }
  }

  private static async extendLock(appointmentId: string) {
    const lock = await prisma.lock.update({
      where: { appointmentId },
      data: {
        expiresAt: new Date(Date.now() + this.LOCK_EXPIRY_MINUTES * 60000)
      },
      include: { user: true }
    });

    // Broadcast lock acquired message (for extension)
    const message: WebSocketMessage = {
      type: 'LOCK_ACQUIRED',
      appointmentId,
      data: lock
    };
    broadcastMessage(message);

    return lock;
  }

  static async getLockStatus(appointmentId: string): Promise<LockResponse> {
    try {
      const lock = await prisma.lock.findUnique({
        where: { appointmentId },
        include: { user: true }
      });

      if (!lock) {
        return { success: true, message: 'Appointment is not locked' };
      }

      if (new Date() > lock.expiresAt) {
        await this.releaseLock(appointmentId);
        return { success: true, message: 'Appointment is not locked' };
      }

      return {
        success: true,
        message: 'Appointment is locked',
        lock
      };
    } catch (error) {
      console.error('Error getting lock status:', error);
      return { success: false, message: 'Failed to get lock status' };
    }
  }
}