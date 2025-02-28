
import { PrismaClient } from '@prisma/client';
import { Claim } from '@prisma/client';

const prisma = new PrismaClient();

export class ClaimsService {
  static async getAllClaims(filters: any = {}): Promise<Claim[]> {
    const query: any = {
      where: filters,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            insuranceProvider: true,
            insurancePolicyNumber: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true
          }
        }
      },
      orderBy: { submissionDate: 'desc' }
    };
    
    return await prisma.claim.findMany(query);
  }

  static async getClaimById(id: string): Promise<Claim | null> {
    return await prisma.claim.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true
      }
    });
  }

  static async createClaim(data: any): Promise<Claim> {
    return await prisma.claim.create({
      data: {
        ...data,
        status: 'PENDING',
        submissionDate: new Date()
      },
      include: {
        patient: true,
        doctor: true
      }
    });
  }

  static async updateClaimStatus(id: string, status: string, notes?: string): Promise<Claim> {
    let updateData: any = { status };
    
    if (status === 'APPROVED') {
      updateData.approvalDate = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectionReason = notes || 'No reason provided';
    } else if (status === 'PENDING_ADDITIONAL_INFO') {
      updateData.additionalInfoRequested = notes || 'Additional information needed';
    }
    
    if (notes) {
      updateData.processingNotes = notes;
    }
    
    return await prisma.claim.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true
      }
    });
  }

  static async updateClaim(id: string, data: any): Promise<Claim> {
    return await prisma.claim.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true
      }
    });
  }

  static async deleteClaim(id: string): Promise<Claim> {
    return await prisma.claim.delete({
      where: { id }
    });
  }
  
  static async getClaimStatistics(): Promise<any> {
    const totalClaims = await prisma.claim.count();
    const approvedClaims = await prisma.claim.count({ where: { status: 'APPROVED' } });
    const rejectedClaims = await prisma.claim.count({ where: { status: 'REJECTED' } });
    const pendingClaims = await prisma.claim.count({ where: { status: 'PENDING' } });
    
    const totalAmount = await prisma.claim.aggregate({
      _sum: { claimAmount: true }
    });
    
    const approvedAmount = await prisma.claim.aggregate({
      _sum: { claimAmount: true },
      where: { status: 'APPROVED' }
    });
    
    return {
      counts: {
        total: totalClaims,
        approved: approvedClaims,
        rejected: rejectedClaims,
        pending: pendingClaims
      },
      amounts: {
        total: totalAmount._sum.claimAmount || 0,
        approved: approvedAmount._sum.claimAmount || 0
      },
      approvalRate: totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0
    };
  }
}
