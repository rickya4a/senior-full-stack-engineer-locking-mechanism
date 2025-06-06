import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const checkLockOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user!.id;

    const lock = await prisma.lock.findUnique({
      where: { appointmentId }
    });

    if (!lock) {
      res.status(403).json({ message: 'You must acquire a lock before editing' });
      return;
    }

    if (lock.userId !== userId) {
      res.status(403).json({ message: 'You do not own the lock for this appointment' });
      return;
    }

    // Check if lock has expired
    if (new Date() > lock.expiresAt) {
      await prisma.lock.delete({ where: { appointmentId } });
      res.status(403).json({ message: 'Lock has expired. Please acquire a new lock' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking lock ownership:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};