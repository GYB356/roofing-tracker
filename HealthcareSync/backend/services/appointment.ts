
import { PrismaClient } from '@prisma/client';
import { Appointment } from '@prisma/client';

const prisma = new PrismaClient();

export class AppointmentService {
  static async getAllAppointments(filters: any = {}): Promise<Appointment[]> {
    const query: any = {
      where: filters,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialty: true
          }
        }
      },
      orderBy: { scheduledTime: 'asc' }
    };
    
    return await prisma.appointment.findMany(query);
  }

  static async getAppointmentById(id: string): Promise<Appointment | null> {
    return await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true
      }
    });
  }

  static async createAppointment(data: any): Promise<Appointment> {
    // Check for existing appointments at the same time for the doctor
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        scheduledTime: data.scheduledTime,
        status: { not: 'CANCELLED' }
      }
    });

    if (conflictingAppointment) {
      throw new Error('Doctor already has an appointment at this time');
    }

    return await prisma.appointment.create({
      data,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialty: true
          }
        }
      }
    });
  }

  static async updateAppointment(id: string, data: any): Promise<Appointment> {
    // If changing appointment time, check for conflicts
    if (data.scheduledTime && data.doctorId) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          doctorId: data.doctorId,
          scheduledTime: data.scheduledTime,
          status: { not: 'CANCELLED' }
        }
      });

      if (conflictingAppointment) {
        throw new Error('Doctor already has an appointment at this time');
      }
    }

    return await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true
      }
    });
  }

  static async deleteAppointment(id: string): Promise<Appointment> {
    return await prisma.appointment.delete({
      where: { id }
    });
  }
  
  static async getDoctorAvailability(doctorId: string, date: Date): Promise<{ time: Date, available: boolean }[]> {
    // Get business hours
    const businessStart = new Date(date);
    businessStart.setHours(9, 0, 0, 0); // 9 AM
    
    const businessEnd = new Date(date);
    businessEnd.setHours(17, 0, 0, 0); // 5 PM
    
    // Get existing appointments for that day
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledTime: {
          gte: businessStart,
          lt: businessEnd
        },
        status: { not: 'CANCELLED' }
      }
    });
    
    // Generate all possible 30-minute slots
    const slots = [];
    const slotLength = 30; // 30 minutes
    
    for (let time = businessStart; time < businessEnd; time = new Date(time.getTime() + slotLength * 60000)) {
      const slotTime = new Date(time);
      const isBooked = appointments.some(apt => {
        const aptTime = new Date(apt.scheduledTime);
        return aptTime.getTime() === slotTime.getTime();
      });
      
      slots.push({
        time: slotTime,
        available: !isBooked
      });
    }
    
    return slots;
  }
}
