import { Request, Response } from 'express';
import { LockService } from '../services/lockService';

export class LockController {
  static async acquireLock(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const userId = req.user!.id;

      const result = await LockService.acquireLock(appointmentId, userId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error in acquireLock controller:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async releaseLock(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = req.params.appointmentId;
      const userId = req.user!.id;

      // Handle raw body data from sendBeacon
      if (Buffer.isBuffer(req.body)) {
        try {
          const rawData = req.body.toString();
          const parsedData = JSON.parse(rawData);
          if (parsedData.appointmentId) {
            const result = await LockService.releaseLock(parsedData.appointmentId, userId);
            res.status(result.success ? 200 : 400).json(result);
            return;
          }
        } catch (parseError) {
          console.error('Error parsing raw body:', parseError);
        }
      }

      const result = await LockService.releaseLock(appointmentId, userId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error in releaseLock controller:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async postReleaseLock(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.body;
      const userId = req.user!.id;

      const result = await LockService.releaseLock(appointmentId, userId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error in postReleaseLock controller:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getLockStatus(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      const result = await LockService.getLockStatus(appointmentId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error in getLockStatus controller:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async adminReleaseLock(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      const result = await LockService.releaseLock(appointmentId);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error in adminReleaseLock controller:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}