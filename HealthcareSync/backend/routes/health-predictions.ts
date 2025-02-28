import { Router } from 'express';
import { AIHealthService, healthPredictionInputSchema } from '../services/ai-health';
import { CacheService } from '../lib/cache';
import { storage } from '../storage';

const router = Router();

// Cache configuration
const CACHE_KEYS = {
  predictions: (patientId: string) => `predictions:${patientId}`,
  insights: (patientId: string) => `insights:${patientId}`,
};

const CACHE_TTL = {
  predictions: 3600, // 1 hour
  insights: 1800,    // 30 minutes
};

// Generate health predictions
router.post('/predictions', async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Validate request body
    const validatedInput = healthPredictionInputSchema.parse(req.body);

    // Generate prediction
    const prediction = await AIHealthService.generateHealthPrediction(validatedInput);

    // Cache the prediction
    await CacheService.set(
      CACHE_KEYS.predictions(req.user.id),
      prediction,
      CACHE_TTL.predictions
    );

    res.json(prediction);
  } catch (error: any) {
    console.error('Health prediction error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid input data',
        errors: error.errors 
      });
    }

    res.status(500).json({ message: 'Failed to generate health prediction' });
  }
});

// Get health insights
router.get('/insights/:patientId', async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const patientId = req.params.patientId;

  try {
    // Try to get cached insights
    const cachedInsights = await CacheService.get(CACHE_KEYS.insights(patientId));
    if (cachedInsights) {
      return res.json(cachedInsights);
    }

    // Fetch required health data
    const healthMetrics = await storage.getHealthMetrics(patientId);
    const medicalHistory = await storage.getMedicalHistory(patientId);

    const healthData = {
      metrics: healthMetrics.map(metric => ({
        type: metric.type,
        value: metric.value,
        timestamp: metric.timestamp,
        unit: metric.unit
      })),
      history: medicalHistory.map(record => ({
        condition: record.condition,
        diagnosis: record.diagnosis,
        date: record.diagnosisDate
      }))
    };

    // Generate insights
    const insights = await AIHealthService.getHealthInsights(patientId, healthData);

    // Cache the insights
    await CacheService.set(
      CACHE_KEYS.insights(patientId),
      insights,
      CACHE_TTL.insights
    );

    res.json(insights);
  } catch (error) {
    console.error('Health insights error:', error);
    res.status(500).json({ message: 'Failed to generate health insights' });
  }
});

export default router;