import prisma from '../lib/prisma';
import { Appointment } from '../generated/prisma';
import { broadcastMessage } from '../lib/websocket';

export class AppointmentService {
  static async create(data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
  }): Promise<Appointment> {
    return prisma.appointment.create({
      data
    });
  }

  static async findAll(): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      include: {
        lock: {
          include: {
            user: true
          }
        }
      }
    });
  }

  static async findById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        lock: {
          include: {
            user: true
          }
        }
      }
    });
  }

  static async update(id: string, data: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<Appointment> {
    const appointment = await prisma.appointment.update({
      where: { id },
      data
    });

    broadcastMessage({
      type: 'APPOINTMENT_UPDATED',
      appointmentId: id,
      data: null
    });

    return appointment;
  }

  static async delete(id: string): Promise<void> {
    // First delete any associated locks
    await prisma.lock.deleteMany({
      where: { appointmentId: id }
    });

    await prisma.appointment.delete({
      where: { id }
    });
  }
}