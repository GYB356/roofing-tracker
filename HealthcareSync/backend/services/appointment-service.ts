
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

export class AppointmentService {
  static async getAllAppointments() {
    return prisma.appointment.findMany({
      include: {
        patient: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          select: {
            fullName: true,
            specialization: true,
          },
        },
      },
    });
  }

  static async getAppointmentById(id) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          select: {
            fullName: true,
            specialization: true,
          },
        },
      },
    });
  }

  static async createAppointment(data) {
    const { patientId, doctorId, dateTime, reason, status, notes } = data;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    return prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        dateTime: new Date(dateTime),
        reason,
        status: status || 'scheduled',
        notes,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          select: {
            fullName: true,
            specialization: true,
          },
        },
      },
    });
  }

  static async updateAppointment(id, data) {
    const { dateTime, reason, status, notes } = data;

    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        dateTime: dateTime ? new Date(dateTime) : undefined,
        reason,
        status,
        notes,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          select: {
            fullName: true,
            specialization: true,
          },
        },
      },
    });
  }

  static async deleteAppointment(id) {
    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    return prisma.appointment.delete({ where: { id } });
  }
}
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

export class AppointmentService {
  static async getAllAppointments() {
    try {
      return await prisma.appointment.findMany({
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { date: 'asc' }
      });
    } catch (error) {
      throw new AppError('Failed to fetch appointments', 500);
    }
  }

  static async getAppointmentById(id: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }

      return appointment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch appointment', 500);
    }
  }

  static async createAppointment(data: any) {
    try {
      // Validate patient and doctor exist
      const patient = await prisma.user.findUnique({
        where: { id: data.patientId }
      });

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      const doctor = await prisma.user.findUnique({
        where: { id: data.doctorId }
      });

      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }

      // Validate appointment time doesn't conflict
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: data.doctorId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          status: { not: 'cancelled' }
        }
      });

      if (existingAppointment) {
        throw new AppError('Doctor is not available at this time', 400);
      }

      // Create appointment
      return await prisma.appointment.create({
        data,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create appointment', 500);
    }
  }

  static async updateAppointment(id: string, data: any) {
    try {
      // Check if the appointment exists
      const existingAppointment = await prisma.appointment.findUnique({
        where: { id }
      });

      if (!existingAppointment) {
        throw new AppError('Appointment not found', 404);
      }

      // If updating time, check for conflicts
      if ((data.doctorId || existingAppointment.doctorId) && 
          (data.date || existingAppointment.date) && 
          (data.startTime || existingAppointment.startTime) && 
          (data.endTime || existingAppointment.endTime)) {
        
        const conflictingAppointment = await prisma.appointment.findFirst({
          where: {
            id: { not: id },
            doctorId: data.doctorId || existingAppointment.doctorId,
            date: data.date || existingAppointment.date,
            startTime: data.startTime || existingAppointment.startTime,
            endTime: data.endTime || existingAppointment.endTime,
            status: { not: 'cancelled' }
          }
        });

        if (conflictingAppointment) {
          throw new AppError('Doctor is not available at this time', 400);
        }
      }

      // Update the appointment
      return await prisma.appointment.update({
        where: { id },
        data,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update appointment', 500);
    }
  }

  static async deleteAppointment(id: string) {
    try {
      // Check if the appointment exists
      const existingAppointment = await prisma.appointment.findUnique({
        where: { id }
      });

      if (!existingAppointment) {
        throw new AppError('Appointment not found', 404);
      }

      // Instead of deleting, we mark it as cancelled
      await prisma.appointment.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      return true;
    } catch (error) {
      throw new AppError('Failed to cancel appointment', 500);
    }
  }

  static async getAppointmentsByPatient(patientId: string) {
    try {
      return await prisma.appointment.findMany({
        where: { patientId },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { date: 'asc' }
      });
    } catch (error) {
      throw new AppError('Failed to fetch appointments', 500);
    }
  }

  static async getAppointmentsByDoctor(doctorId: string) {
    try {
      return await prisma.appointment.findMany({
        where: { doctorId },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { date: 'asc' }
      });
    } catch (error) {
      throw new AppError('Failed to fetch appointments', 500);
    }
  }
}
