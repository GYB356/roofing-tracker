
import { PrismaClient } from '@prisma/client';
import { Patient } from '@prisma/client';

const prisma = new PrismaClient();

export class PatientService {
  static async getAllPatients(doctorId?: string): Promise<Patient[]> {
    const query: any = {};
    if (doctorId) {
      query.where = { doctorId };
    }
    
    return await prisma.patient.findMany(query);
  }

  static async getPatientById(id: string): Promise<Patient | null> {
    return await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: true,
        medicalRecords: true,
        healthMetrics: true,
        prescriptions: true,
        claims: true,
      }
    });
  }

  static async createPatient(data: any): Promise<Patient> {
    return await prisma.patient.create({
      data
    });
  }

  static async updatePatient(id: string, data: any): Promise<Patient> {
    return await prisma.patient.update({
      where: { id },
      data
    });
  }

  static async deletePatient(id: string): Promise<Patient> {
    return await prisma.patient.delete({
      where: { id }
    });
  }
  
  static async searchPatients(query: string): Promise<Patient[]> {
    return await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query, mode: 'insensitive' } }
        ]
      }
    });
  }
}
