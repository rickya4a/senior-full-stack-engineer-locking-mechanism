import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService';

export class AppointmentController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await AppointmentService.create({
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime)
      });
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: 'Failed to create appointment' });
    }
  }

  static async findAll(req: Request, res: Response): Promise<void> {
    try {
      const appointments = await AppointmentService.findAll();
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  }

  static async findById(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await AppointmentService.findById(req.params.id);
      if (!appointment) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }
      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ message: 'Failed to fetch appointment' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const data = { ...req.body };
      if (data.startTime) data.startTime = new Date(data.startTime);
      if (data.endTime) data.endTime = new Date(data.endTime);

      const appointment = await AppointmentService.update(req.params.id, data);
      res.json(appointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: 'Failed to update appointment' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      await AppointmentService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: 'Failed to delete appointment' });
    }
  }
}