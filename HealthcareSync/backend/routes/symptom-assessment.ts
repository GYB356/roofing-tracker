import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { assessments, symptoms, insertAssessmentSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { NotificationService } from "../services/notification-service";
import { AIHealthService } from "../services/ai-health";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Get available symptoms
router.get("/symptoms", requireAuth, async (req, res) => {
  try {
    const symptomsList = await prisma.symptoms.findMany({
      orderBy: { category: 'asc' }
    });

    res.json(symptomsList);
  } catch (error: any) {
    console.error("Error fetching symptoms:", error);
    res.status(500).json({ 
      message: "Failed to fetch symptoms",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Submit new assessment
router.post("/assess", requireAuth, async (req, res) => {
  try {
    const validatedData = insertAssessmentSchema.parse(req.body);

    // Generate AI health prediction
    const healthPrediction = await AIHealthService.generateHealthPrediction({
      age: req.body.age || 0,
      gender: req.body.gender || "unknown",
      symptoms: req.body.symptoms.map((s: any) => s.name),
      medicalHistory: [],
      currentMedications: [],
      vitalSigns: {
        bloodPressure: "120/80",
        heartRate: 70,
        temperature: 37,
      }
    });

    // Store assessment with AI predictions
    const [assessment] = await prisma.assessments.create({
      data: {
        ...validatedData,
        patientId: req.user?.id,
        date: new Date(),
        urgencyLevel: healthPrediction.riskLevel,
        recommendation: healthPrediction.recommendations.join("\n"),
      }
    });

    // Send notification based on urgency
    const isUrgent = ["urgent", "emergency"].includes(healthPrediction.riskLevel);
    await NotificationService.createAlert({
      userId: req.user?.id,
      title: `Symptom Assessment ${isUrgent ? "- Urgent" : ""}`,
      message: isUrgent 
        ? "Your symptoms require immediate medical attention. Please contact your healthcare provider."
        : "Your symptom assessment has been recorded.",
      priority: isUrgent ? "high" : "normal"
    });

    res.status(201).json({
      assessment,
      predictions: healthPrediction
    });
  } catch (error: any) {
    console.error("Error creating assessment:", error);
    res.status(500).json({ 
      message: "Failed to create assessment",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get patient's assessment history
router.get("/history/:patientId", requireAuth, async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Ensure user has access to these assessments
    if (req.user?.role === 'patient' && req.user?.id !== patientId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assessmentHistory = await prisma.assessments.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
      take: 10,
    });

    res.json(assessmentHistory);
  } catch (error: any) {
    console.error("Error fetching assessment history:", error);
    res.status(500).json({ 
      message: "Failed to fetch assessment history",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;