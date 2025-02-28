
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

export class PatientService {
  static async getAllPatients() {
    return prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  static async getPatientById(id) {
    return prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        medicalRecords: true,
        appointments: true,
      },
    });
  }

  static async createPatient(data) {
    const { userId, dateOfBirth, gender, phoneNumber, address, emergencyContact } = data;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if patient already exists for this user
    const existingPatient = await prisma.patient.findFirst({ where: { userId } });
    if (existingPatient) {
      throw new AppError('Patient profile already exists for this user', 400);
    }

    return prisma.patient.create({
      data: {
        userId,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phoneNumber,
        address,
        emergencyContact,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  static async updatePatient(id, data) {
    const { dateOfBirth, gender, phoneNumber, address, emergencyContact } = data;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    return prisma.patient.update({
      where: { id },
      data: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        phoneNumber,
        address,
        emergencyContact,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  static async deletePatient(id) {
    // Check if patient exists
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    return prisma.patient.delete({ where: { id } });
  }
}
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

export class PatientService {
  static async getAllPatients() {
    try {
      return await prisma.patient.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          healthMetrics: true,
          medicalRecords: true
        }
      });
    } catch (error) {
      throw new AppError('Failed to fetch patients', 500);
    }
  }

  static async getPatientById(id: string) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          healthMetrics: true,
          medicalRecords: true
        }
      });

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      return patient;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch patient', 500);
    }
  }

  static async createPatient(data: any) {
    try {
      // Validate if the user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Create new patient record
      return await prisma.patient.create({
        data,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create patient', 500);
    }
  }

  static async updatePatient(id: string, data: any) {
    try {
      // Check if the patient exists
      const existingPatient = await prisma.patient.findUnique({
        where: { id }
      });

      if (!existingPatient) {
        throw new AppError('Patient not found', 404);
      }

      // Update the patient
      return await prisma.patient.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update patient', 500);
    }
  }

  static async deletePatient(id: string) {
    try {
      // Check if the patient exists
      const existingPatient = await prisma.patient.findUnique({
        where: { id }
      });

      if (!existingPatient) {
        throw new AppError('Patient not found', 404);
      }

      // Delete the patient
      await prisma.patient.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      throw new AppError('Failed to delete patient', 500);
    }
  }

  static async getPatientHealthMetrics(patientId: string) {
    try {
      return await prisma.healthMetric.findMany({
        where: { patientId },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      throw new AppError('Failed to fetch health metrics', 500);
    }
  }

  static async getPatientMedicalRecords(patientId: string) {
    try {
      return await prisma.medicalRecord.findMany({
        where: { patientId },
        orderBy: { date: 'desc' }
      });
    } catch (error) {
      throw new AppError('Failed to fetch medical records', 500);
    }
  }
}
