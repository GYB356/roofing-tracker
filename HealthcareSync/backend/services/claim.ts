
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ClaimService {
  static async getAll(filters = {}) {
    return await prisma.claim.findMany({
      where: filters,
      orderBy: { submissionDate: 'desc' },
      include: {
        patient: true
      }
    });
  }

  static async getById(id: number) {
    return await prisma.claim.findUnique({
      where: { id },
      include: {
        patient: true
      }
    });
  }

  static async create(data: any) {
    return await prisma.claim.create({
      data: {
        patientId: parseInt(data.patientId),
        doctorId: parseInt(data.doctorId),
        amount: data.amount,
        status: data.status,
        submissionDate: new Date(data.submissionDate),
        description: data.description
      }
    });
  }

  static async updateStatus(id: number, status: string) {
    return await prisma.claim.update({
      where: { id },
      data: { status }
    });
  }

  static async update(id: number, data: any) {
    return await prisma.claim.update({
      where: { id },
      data
    });
  }

  static async delete(id: number) {
    return await prisma.claim.delete({
      where: { id }
    });
  }

  static async getStatistics() {
    const totalClaims = await prisma.claim.count();
    const approvedClaims = await prisma.claim.count({ where: { status: 'approved' } });
    const rejectedClaims = await prisma.claim.count({ where: { status: 'rejected' } });
    const pendingClaims = await prisma.claim.count({ where: { status: 'pending' } });
    
    const totalAmountResult = await prisma.claim.aggregate({
      _sum: {
        amount: true
      },
      where: { status: 'approved' }
    });
    
    const totalAmount = totalAmountResult._sum.amount || 0;
    
    return {
      totalClaims,
      approvedClaims,
      rejectedClaims,
      pendingClaims,
      totalAmount
    };
  }
}
