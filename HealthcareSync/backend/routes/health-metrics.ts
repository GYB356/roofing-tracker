import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { AIHealthService } from "../services/ai-health";
import { NotificationService } from "../services/notification-service";
import { HealthMetricsService } from "../services/health-metrics";
import { requireAuth, requireRole } from "../middleware/auth";
import { MetricType } from "@prisma/client";

const router = Router();

// Get health metrics for a patient
router.get("/:patientId", requireAuth, async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Check if user has access to these metrics
    if (req.user?.role === 'patient' && req.user?.id !== patientId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const metrics = await HealthMetricsService.getPatientHealthMetrics(patientId);

    // Get AI insights for these metrics if available
    let insights = [];
    try {
      const healthData = {
        metrics,
        history: [], // Will be populated with medical history in future
      };

      const aiInsights = await AIHealthService.getHealthInsights(patientId, healthData);
      insights = aiInsights.insights || [];
    } catch (error) {
      console.error("Error fetching health insights:", error);
      // Continue without insights if there's an error
    }

    res.json({
      metrics,
      insights,
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    res.status(500).json({ 
      message: "Failed to fetch health metrics",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Get health metrics by type for a patient
router.get("/:patientId/type/:type", requireAuth, async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const type = req.params.type as MetricType;

    // Check if user has access to these metrics
    if (req.user?.role === 'patient' && req.user?.id !== patientId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const metrics = await HealthMetricsService.getPatientHealthMetricsByType(patientId, type);

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching health metrics by type:", error);
    res.status(500).json({ 
      message: "Failed to fetch health metrics",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Get health trends for a patient
router.get("/:patientId/trends", requireAuth, async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Check if user has access to these metrics
    if (req.user?.role === 'patient' && req.user?.id !== patientId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const trends = await HealthMetricsService.getPatientHealthTrends(patientId);

    res.json(trends);
  } catch (error) {
    console.error("Error fetching health trends:", error);
    res.status(500).json({ 
      message: "Failed to fetch health trends",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Record new health metric
router.post("/", requireAuth, async (req, res) => {
  try {
    const { type, value, unit, notes, patientId: reqPatientId } = req.body;

    // If patient is adding their own metric, use their ID, otherwise use the provided patient ID
    const patientId = req.user?.role === 'patient' ? req.user?.id : reqPatientId;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    // Create health metric
    const newMetric = await HealthMetricsService.createHealthMetric({
      patientId,
      type,
      value,
      unit,
      notes
    });

    // Create notification for abnormal readings if needed
    const isAbnormal = await checkIfMetricIsAbnormal(type, value, unit);
    if (isAbnormal) {
      await NotificationService.createAlert({
        userId: patientId,
        title: "Abnormal Health Reading",
        message: `Your ${type} reading of ${value} ${unit} is outside normal ranges.`,
        priority: "high"
      });
    }

    res.status(201).json(newMetric);
  } catch (error) {
    console.error("Error creating health metric:", error);
    res.status(500).json({ 
      message: "Failed to create health metric",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Helper function to check if a metric reading is abnormal
// This is a placeholder and should be replaced with actual clinical guidelines
async function checkIfMetricIsAbnormal(type: string, value: string, unit: string): Promise<boolean> {
  const numValue = parseFloat(value);

  if (isNaN(numValue)) return false;

  switch (type) {
    case "blood_pressure":
      // Example threshold for systolic/diastolic
      const parts = value.split('/');
      if (parts.length === 2) {
        const systolic = parseInt(parts[0], 10);
        const diastolic = parseInt(parts[1], 10);
        return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
      }
      return false;
    case "heart_rate":
      return numValue > 100 || numValue < 60;
    case "blood_glucose":
      return numValue > 180 || numValue < 70;
    case "weight":
      // This would need patient-specific thresholds
      return false;
    default:
      return false;
  }
}

export default router;
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Minimal implementation - get all health metrics
router.get('/', async (req, res) => {
  try {
    const healthMetrics = await prisma.healthMetric.findMany();
    res.json(healthMetrics);
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    res.status(500).json({ error: 'Failed to fetch health metrics' });
  }
});

export default router;
