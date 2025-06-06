import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService';

export class AppointmentController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const appointments = await AppointmentService.findAll();
      res.json(appointments);
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  }

  static async getOne(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await AppointmentService.findById(req.params.id);
      if (!appointment) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }
      res.json(appointment);
    } catch (error) {
      console.error('Error in getOne:', error);
      res.status(500).json({ message: 'Failed to fetch appointment' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, startTime, endTime } = req.body;

      if (!title || !startTime || !endTime) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const appointment = await AppointmentService.create({
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      });

      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error in create:', error);
      res.status(500).json({ message: 'Failed to create appointment' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, startTime, endTime } = req.body;
      const id = req.params.id;

      if (!title || !startTime || !endTime) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const appointment = await AppointmentService.update(id, {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      });

      res.json(appointment);
    } catch (error) {
      console.error('Error in update:', error);
      res.status(500).json({ message: 'Failed to update appointment' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      await AppointmentService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error in delete:', error);
      res.status(500).json({ message: 'Failed to delete appointment' });
    }
  }
}