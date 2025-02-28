
import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

export class HealthMetricService {
  static async getAllHealthMetrics() {
    try {
      return await prisma.healthMetric.findMany({
        include: {
          patient: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      throw new AppError('Failed to fetch health metrics', 500);
    }
  }

  static async getHealthMetricById(id: string) {
    try {
      const healthMetric = await prisma.healthMetric.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!healthMetric) {
        throw new AppError('Health metric not found', 404);
      }

      return healthMetric;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch health metric', 500);
    }
  }

  static async createHealthMetric(data: any) {
    try {
      // Validate the patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId }
      });

      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      // Create new health metric
      return await prisma.healthMetric.create({
        data,
        include: {
          patient: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create health metric', 500);
    }
  }

  static async updateHealthMetric(id: string, data: any) {
    try {
      // Check if the health metric exists
      const existingHealthMetric = await prisma.healthMetric.findUnique({
        where: { id }
      });

      if (!existingHealthMetric) {
        throw new AppError('Health metric not found', 404);
      }

      // Update the health metric
      return await prisma.healthMetric.update({
        where: { id },
        data,
        include: {
          patient: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update health metric', 500);
    }
  }

  static async deleteHealthMetric(id: string) {
    try {
      // Check if the health metric exists
      const existingHealthMetric = await prisma.healthMetric.findUnique({
        where: { id }
      });

      if (!existingHealthMetric) {
        throw new AppError('Health metric not found', 404);
      }

      // Delete the health metric
      await prisma.healthMetric.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      throw new AppError('Failed to delete health metric', 500);
    }
  }

  static async getHealthMetricsByPatient(patientId: string) {
    try {
      return await prisma.healthMetric.findMany({
        where: { patientId },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      throw new AppError('Failed to fetch health metrics', 500);
    }
  }

  static async getHealthMetricsByType(patientId: string, type: string) {
    try {
      return await prisma.healthMetric.findMany({
        where: { 
          patientId,
          type
        },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      throw new AppError('Failed to fetch health metrics', 500);
    }
  }
}
