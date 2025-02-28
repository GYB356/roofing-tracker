
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();
const prisma = new PrismaClient();

// Get all claims (with filters)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { patientId, status, startDate, endDate } = req.query;
    
    const filter: any = {};
    
    if (patientId) filter.patientId = parseInt(patientId as string);
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.submissionDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    const claims = await prisma.claim.findMany({
      where: filter,
      orderBy: { submissionDate: 'desc' }
    });
    
    res.json(claims);
  } catch (error) {
    console.error("Error fetching claims:", error);
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// Get claim by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        patient: true
      }
    });
    
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }
    
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch claim" });
  }
});

// Create new claim
router.post('/', requireAuth, async (req, res) => {
  try {
    const { patientId, doctorId, amount, status, submissionDate, description } = req.body;
    
    const claim = await prisma.claim.create({
      data: {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        amount,
        status,
        submissionDate: new Date(submissionDate),
        description
      }
    });
    
    auditLog(req.user?.id || 0, 'claim', 'create', claim.id);
    res.status(201).json(claim);
  } catch (error) {
    console.error("Error creating claim:", error);
    res.status(500).json({ error: "Failed to create claim" });
  }
});

// Update claim status
router.patch('/:id/status', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    const claim = await prisma.claim.update({
      where: { id },
      data: { status }
    });
    
    // Log status change
    auditLog(req.user?.id || 0, 'claim', 'update_status', claim.id, `Status changed to ${status}`);
    
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: "Failed to update claim status" });
  }
});

// Update claim
router.put('/:id', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, description } = req.body;
    
    const claim = await prisma.claim.update({
      where: { id },
      data: { 
        amount,
        description
      }
    });
    
    auditLog(req.user?.id || 0, 'claim', 'update', claim.id);
    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: "Failed to update claim" });
  }
});

// Delete claim
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await prisma.claim.delete({
      where: { id }
    });
    
    auditLog(req.user?.id || 0, 'claim', 'delete', id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete claim" });
  }
});

// Get claims statistics
router.get('/stats/summary', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const totalClaims = await prisma.claim.count();
    const approvedClaims = await prisma.claim.count({ where: { status: 'approved' } });
    const rejectedClaims = await prisma.claim.count({ where: { status: 'rejected' } });
    const pendingClaims = await prisma.claim.count({ where: { status: 'pending' } });
    
    // Calculate total amount
    const totalAmountResult = await prisma.claim.aggregate({
      _sum: {
        amount: true
      },
      where: { status: 'approved' }
    });
    
    const totalAmount = totalAmountResult._sum.amount || 0;
    
    res.json({
      totalClaims,
      approvedClaims,
      rejectedClaims,
      pendingClaims,
      totalAmount
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch claims statistics" });
  }
});

export default router;
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Minimal implementation - get all claims
router.get('/', async (req, res) => {
  try {
    const claims = await prisma.claim.findMany();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

export default router;
