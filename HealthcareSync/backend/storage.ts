import { PrismaClient, User } from "@prisma/client";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { log } from "./vite";
import { prisma } from '../lib/prisma';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;

  // Patient operations
  getPatients(page?: number, limit?: number): Promise<Patient[]>;
  getPatientsCount(filters?: any): Promise<number>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(data: any): Promise<Patient>;
  updatePatient(id: string, data: any): Promise<Patient>;
  deletePatient(id: string): Promise<void>;

  // Appointment operations
  getAppointments(filters?: any, page?: number, limit?: number): Promise<Appointment[]>;
  getAppointmentsCount(filters?: any): Promise<number>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(data: any): Promise<Appointment>;
  updateAppointment(id: string, data: any): Promise<Appointment>;
  checkTimeSlotAvailability(doctorId: string, dateStr: string, excludeAppointmentId?: string): Promise<boolean>;
  getAvailableTimeSlots(doctorId: string, dateStr: string): Promise<{ time: string; available: boolean }[]>;
  deleteAppointment(id: string): Promise<void>;

  // Health Metrics operations
  getHealthMetric(id: number): Promise<HealthMetric | undefined>;
  getHealthMetrics(): Promise<HealthMetric[]>;
  getHealthMetricsByPatientId(patientId: number): Promise<HealthMetric[]>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  updateHealthMetric(id: number, metric: Partial<InsertHealthMetric>): Promise<HealthMetric>;
  deleteHealthMetric(id: number): Promise<void>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotifications(): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;

  // Prescription operations
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptions(): Promise<Prescription[]>;
  getActivePrescriptionsByPatientId(patientId: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription>;
  deletePrescription(id: number): Promise<void>;

  //Claim operations
  getClaim(id: number): Promise<Claim | undefined>;
  getClaims(filters?: any, page?: number, limit?: number): Promise<Claim[]>;
  getClaimsCount(filters?: any): Promise<number>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: number, claim: Partial<InsertClaim>): Promise<Claim>;
  deleteClaim(id: number): Promise<void>;

  // Symptom operations
  getSymptoms(): Promise<Symptom[]>;
  createSymptom(symptom: InsertSymptom): Promise<Symptom>;

  // Assessment operations
  getAssessments(): Promise<Assessment[]>;
  getAssessmentsByPatientId(patientId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;

  // Medical Records operations
  getMedicalRecords(): Promise<MedicalRecord[]>;
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatientId(patientId: number): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: number, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord>;
  deleteMedicalRecord(id: number): Promise<void>;

  // Stripe integration
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null>;

  sessionStore: typeof PostgresSessionStore.prototype;
}

export class DatabaseStorage implements IStorage {
  sessionStore: typeof PostgresSessionStore.prototype;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    }) as typeof PostgresSessionStore.prototype;
  }

  async getUser(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username }
    });
  }

  async createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    return await prisma.user.create({
      data: user
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: userData
    });
  }
  async getPatients(page: number = 1, limit: number = 10): Promise<Patient[]> {
    const skip = (page - 1) * limit;
    return await this.prisma.patient.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPatientsCount(filters: any = {}): Promise<number> {
    const where = {}; // Add filters here if needed
    return await this.prisma.patient.count({ where });
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return await this.prisma.patient.findUnique({ where: { id } });
  }

  async createPatient(data: any): Promise<Patient> {
    return await this.prisma.patient.create({ data });
  }

  async updatePatient(id: string, data: any): Promise<Patient> {
    return await this.prisma.patient.update({
      where: { id },
      data
    });
  }

  async deletePatient(id: string): Promise<void> {
    await this.prisma.patient.delete({ where: { id } });
  }

  async getAppointments(filters: any = {}, page: number = 1, limit: number = 10): Promise<Appointment[]> {
    const skip = (page - 1) * limit;
    const where: any = {};

    //Apply filters (similar to original code)

    return await this.prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'asc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        doctor: {
          select: {
            fullName: true,
            specialty: true
          }
        }
      }
    });
  }

  async getAppointmentsCount(filters: any = {}): Promise<number> {
    const where: any = {};
    //Apply filters (similar to original code)
    return await this.prisma.appointment.count({ where });
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
            email: true
          }
        },
        doctor: {
          select: {
            fullName: true,
            specialty: true,
            email: true
          }
        }
      }
    });
  }

  async createAppointment(data: any): Promise<Appointment> {
    return await this.prisma.appointment.create({ data });
  }

  async updateAppointment(id: string, data: any): Promise<Appointment> {
    return await this.prisma.appointment.update({
      where: { id },
      data
    });
  }

  async checkTimeSlotAvailability(doctorId: string, dateStr: string, excludeAppointmentId?: string): Promise<boolean> {
    const date = new Date(dateStr);
    // Implement time slot check logic using Prisma
    return true; // Replace with actual implementation
  }

  async getAvailableTimeSlots(doctorId: string, dateStr: string): Promise<{ time: string; available: boolean }[]> {
    const date = new Date(dateStr);
    // Implement available time slot generation using Prisma
    return []; // Replace with actual implementation

  }

  async deleteAppointment(id: string): Promise<void> {
    await this.prisma.appointment.delete({ where: { id } });
  }

  async getClaims(filters: any = {}, page: number = 1, limit: number = 10): Promise<Claim[]> {
    const skip = (page - 1) * limit;
    const where: any = {};
    //Apply filters (similar to original code)
    return await this.prisma.claim.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submissionDate: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            fullName: true
          }
        }
      }
    });
  }

  async getClaimsCount(filters: any = {}): Promise<number> {
    const where: any = {};
    //Apply filters (similar to original code)
    return await this.prisma.claim.count({ where });
  }

  async getClaim(id: string): Promise<Claim | undefined> {
    return await this.prisma.claim.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            fullName: true,
            specialty: true
          }
        }
      }
    });
  }

  async createClaim(data: any): Promise<Claim> {
    return await this.prisma.claim.create({ data });
  }

  async updateClaim(id: string, data: any): Promise<Claim> {
    return await this.prisma.claim.update({
      where: { id },
      data
    });
  }

  async deleteClaim(id: string): Promise<void> {
    await this.prisma.claim.delete({ where: { id } });
  }

  async getHealthMetric(id: number): Promise<HealthMetric | undefined> {
    return await this.prisma.healthMetric.findUnique({ where: { id } });
  }
  async getHealthMetrics(): Promise<HealthMetric[]> {
    return await this.prisma.healthMetric.findMany();
  }
  async getHealthMetricsByPatientId(patientId: number): Promise<HealthMetric[]> {
    return await this.prisma.healthMetric.findMany({ where: { patientId } });
  }
  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    return await this.prisma.healthMetric.create({ data: metric });
  }
  async updateHealthMetric(id: number, metric: Partial<InsertHealthMetric>): Promise<HealthMetric> {
    return await this.prisma.healthMetric.update({ where: { id }, data: metric });
  }
  async deleteHealthMetric(id: number): Promise<void> {
    await this.prisma.healthMetric.delete({ where: { id } });
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return await this.prisma.notification.findUnique({ where: { id } });
  }
  async getNotifications(): Promise<Notification[]> {
    return await this.prisma.notification.findMany();
  }
  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await this.prisma.notification.findMany({ where: { userId, read: false } });
  }
  async createNotification(notification: InsertNotification): Promise<Notification> {
    return await this.prisma.notification.create({ data: notification });
  }
  async markNotificationAsRead(id: number): Promise<Notification> {
    return await this.prisma.notification.update({ where: { id }, data: { read: true } });
  }
  async deleteNotification(id: number): Promise<void> {
    await this.prisma.notification.delete({ where: { id } });
  }

  async getPrescription(id: number): Promise<Prescription | undefined> {
    return await this.prisma.prescription.findUnique({ where: { id } });
  }
  async getPrescriptions(): Promise<Prescription[]> {
    return await this.prisma.prescription.findMany();
  }
  async getActivePrescriptionsByPatientId(patientId: number): Promise<Prescription[]> {
    return await this.prisma.prescription.findMany({ where: { patientId, active: true } });
  }
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    return await this.prisma.prescription.create({ data: prescription });
  }
  async updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription> {
    return await this.prisma.prescription.update({ where: { id }, data: prescription });
  }
  async deletePrescription(id: number): Promise<void> {
    await this.prisma.prescription.delete({ where: { id } });
  }

  async getClaim(id: number): Promise<Claim | undefined> {
    return await this.prisma.claim.findUnique({ where: { id } });
  }
  async getClaims(filters?: any, page: number = 1, limit: number = 10): Promise<Claim[]> {
    const skip = (page - 1) * limit;
    const where: any = {};
    //Apply filters (similar to original code)
    return await this.prisma.claim.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submissionDate: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            fullName: true
          }
        }
      }
    });
  }
  async getClaimsCount(filters?: any): Promise<number> {
    const where: any = {};
    //Apply filters (similar to original code)
    return await this.prisma.claim.count({ where });
  }
  async createClaim(claim: InsertClaim): Promise<Claim> {
    return await this.prisma.claim.create({ data: claim });
  }
  async updateClaim(id: number, claim: Partial<InsertClaim>): Promise<Claim> {
    return await this.prisma.claim.update({ where: { id }, data: claim });
  }
  async deleteClaim(id: number): Promise<void> {
    await this.prisma.claim.delete({ where: { id } });
  }

  async getSymptoms(): Promise<Symptom[]> {
    return await this.prisma.symptom.findMany();
  }
  async createSymptom(symptom: InsertSymptom): Promise<Symptom> {
    return await this.prisma.symptom.create({ data: symptom });
  }

  async getAssessments(): Promise<Assessment[]> {
    return await this.prisma.assessment.findMany();
  }
  async getAssessmentsByPatientId(patientId: number): Promise<Assessment[]> {
    return await this.prisma.assessment.findMany({ where: { patientId } });
  }
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    return await this.prisma.assessment.create({ data: assessment });
  }

  async getMedicalRecords(): Promise<MedicalRecord[]> {
    return await this.prisma.medicalRecord.findMany();
  }
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    return await this.prisma.medicalRecord.findUnique({ where: { id } });
  }
  async getMedicalRecordsByPatientId(patientId: number): Promise<MedicalRecord[]> {
    return await this.prisma.medicalRecord.findMany({ where: { patientId } });
  }
  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    return await this.prisma.medicalRecord.create({ data: record });
  }
  async updateMedicalRecord(id: number, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord> {
    return await this.prisma.medicalRecord.update({ where: { id }, data: record });
  }
  async deleteMedicalRecord(id: number): Promise<void> {
    await this.prisma.medicalRecord.delete({ where: { id } });
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { stripeCustomerId }
    });
  }

  async $disconnect() {
    await this.prisma.$disconnect();
  }
}

export const storage = new DatabaseStorage();

export function setupStorage() {
  log("Storage system initialized");
  return storage;
}