import { prisma } from '../../lib/prisma';
import { AppError } from '../utils/app-error';

export interface Prescription {
  id: string;
  patientId: string;
  providerId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  refillsAllowed: number;
  refillsRemaining: number;
  instructions: string;
  sideEffects: string[];
  interactions: string[];
  pharmacyId: string;
  lastFilledDate?: string;
  createdAt: string;
  updatedAt: string;
}

export class PrescriptionService {
  static async createPrescription(data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prescription> {
    try {
      // Validate patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId }
      });
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      // Validate provider exists
      const provider = await prisma.provider.findUnique({
        where: { id: data.providerId }
      });
      if (!provider) {
        throw new AppError('Provider not found', 404);
      }

      // Check drug interactions
      const activePatientPrescriptions = await this.getActivePatientPrescriptions(data.patientId);
      const interactions = await this.checkDrugInteractions(data.drugName, activePatientPrescriptions);

      // Create prescription with interaction warnings
      const prescription = await prisma.prescription.create({
        data: {
          ...data,
          interactions,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });

      return prescription;
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  static async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      return await prisma.prescription.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      throw error;
    }
  }

  static async getActivePatientPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      return await prisma.prescription.findMany({
        where: {
          patientId,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching active prescriptions:', error);
      throw error;
    }
  }

  static async updatePrescription(
    prescriptionId: string,
    data: Partial<Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Prescription> {
    try {
      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId }
      });

      if (!prescription) {
        throw new AppError('Prescription not found', 404);
      }

      // If drug is being changed, check for new interactions
      let interactions = prescription.interactions;
      if (data.drugName && data.drugName !== prescription.drugName) {
        const activePatientPrescriptions = await this.getActivePatientPrescriptions(prescription.patientId);
        interactions = await this.checkDrugInteractions(data.drugName, activePatientPrescriptions);
      }

      return await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          ...data,
          interactions,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    }
  }

  static async processPrescriptionRefill(prescriptionId: string): Promise<Prescription> {
    try {
      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId }
      });

      if (!prescription) {
        throw new AppError('Prescription not found', 404);
      }

      if (prescription.refillsRemaining <= 0) {
        throw new AppError('No refills remaining', 400);
      }

      return await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          refillsRemaining: prescription.refillsRemaining - 1,
          lastFilledDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error processing prescription refill:', error);
      throw error;
    }
  }

  static async cancelPrescription(prescriptionId: string): Promise<Prescription> {
    try {
      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId }
      });

      if (!prescription) {
        throw new AppError('Prescription not found', 404);
      }

      return await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error cancelling prescription:', error);
      throw error;
    }
  }

  private static async checkDrugInteractions(drugName: string, activePrescriptions: Prescription[]): Promise<string[]> {
    // TODO: Integrate with external drug interaction API
    // For now, return mock interactions
    const mockInteractions = new Map<string, string[]>([
      ['aspirin', ['warfarin', 'heparin']],
      ['ibuprofen', ['warfarin', 'aspirin']],
      ['warfarin', ['aspirin', 'ibuprofen']],
      ['heparin', ['aspirin']]
    ]);

    const interactions: string[] = [];
    const currentDrugInteractions = mockInteractions.get(drugName.toLowerCase()) || [];

    activePrescriptions.forEach(prescription => {
      if (currentDrugInteractions.includes(prescription.drugName.toLowerCase())) {
        interactions.push(
          `Potential interaction with ${prescription.drugName} (currently prescribed)`
        );
      }
    });

    return interactions;
  }
}