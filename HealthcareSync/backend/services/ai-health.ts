import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Validation schemas
export const healthPredictionInputSchema = z.object({
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  symptoms: z.array(z.string()),
  medicalHistory: z.array(z.string()),
  currentMedications: z.array(z.string()),
  vitalSigns: z.object({
    bloodPressure: z.string(),
    heartRate: z.number().min(30).max(250),
    temperature: z.number().min(95).max(108),
    oxygenSaturation: z.number().min(50).max(100).optional(),
  }),
});

export type HealthPredictionInput = z.infer<typeof healthPredictionInputSchema>;

export interface HealthPrediction {
  riskLevel: 'low' | 'moderate' | 'high';
  predictions: string[];
  recommendations: string[];
  followUpNeeded: boolean;
  confidence: number;
  analysisDate: string;
  nextCheckupDate?: string;
}

export class AIHealthService {
  private static readonly MODELS = {
    GPT4: "gpt-4o" as const,
  };

  private static async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status === 429) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  static async generateHealthPrediction(input: HealthPredictionInput): Promise<HealthPrediction> {
    try {
      // Validate input
      const validatedInput = healthPredictionInputSchema.parse(input);

      const response = await this.retryWithExponentialBackoff(async () => {
        return await openai.chat.completions.create({
          model: this.MODELS.GPT4,
          messages: [
            {
              role: "system",
              content: `You are an advanced healthcare AI assistant trained to provide detailed health predictions and recommendations.
              Analyze the patient's data holistically considering:
              1. Symptom patterns and severity
              2. Medical history impact
              3. Current medication interactions
              4. Vital signs analysis
              5. Age and gender-specific risk factors
              6. Lifestyle factors

              Provide a comprehensive analysis including:
              - Risk level assessment
              - Short and long-term health predictions
              - Personalized recommendations
              - Follow-up requirements
              - Confidence score based on data completeness

              Format: Respond with a JSON object containing:
              {
                "riskLevel": "low" | "moderate" | "high",
                "predictions": string[],
                "recommendations": string[],
                "followUpNeeded": boolean,
                "confidence": number (0-1),
                "analysisDate": ISO date string,
                "nextCheckupDate": ISO date string (optional)
              }`
            },
            {
              role: "user",
              content: JSON.stringify(validatedInput)
            }
          ],
          response_format: { type: "json_object" }
        });
      });

      if (!response.choices[0].message.content) {
        throw new Error("Invalid AI response");
      }

      const result = JSON.parse(response.choices[0].message.content);

      // Validate response structure
      if (!result.riskLevel || !result.predictions || !result.recommendations) {
        throw new Error("Invalid AI response format");
      }

      return {
        riskLevel: result.riskLevel,
        predictions: result.predictions,
        recommendations: result.recommendations,
        followUpNeeded: result.followUpNeeded || false,
        confidence: result.confidence || 0.8,
        analysisDate: result.analysisDate || new Date().toISOString(),
        nextCheckupDate: result.nextCheckupDate
      };
    } catch (error) {
      console.error('AI Health Prediction error:', error);

      // Return a safe fallback response
      return {
        riskLevel: 'low',
        predictions: ['Unable to generate predictions at this time'],
        recommendations: [
          'Please consult with your healthcare provider for personalized recommendations',
          'Schedule a follow-up appointment to discuss your health concerns'
        ],
        followUpNeeded: true,
        confidence: 0,
        analysisDate: new Date().toISOString()
      };
    }
  }

  static async getHealthInsights(
    patientId: string,
    healthData: {
      metrics: Array<{
        type: string;
        value: number | string;
        timestamp: string;
        unit: string;
      }>,
      history: Array<{
        condition: string;
        diagnosis: string;
        date: string;
      }>
    }
  ): Promise<{
    insights: string[];
    urgentActions: string[];
    lastAnalyzed: string;
    riskFactors: string[];
    recommendedTests: string[];
  }> {
    try {
      const response = await this.retryWithExponentialBackoff(async () => {
        return await openai.chat.completions.create({
          model: this.MODELS.GPT4,
          messages: [
            {
              role: "system",
              content: `As a healthcare AI assistant, analyze patient health data to provide:
              1. Key health insights based on metric trends
              2. Urgent actions needed
              3. Risk factors identified
              4. Recommended medical tests

              Consider:
              - Abnormal vital sign patterns
              - Chronic condition indicators
              - Medication effectiveness
              - Lifestyle impact

              Format: JSON with insights[], urgentActions[], riskFactors[], recommendedTests[],
              and lastAnalyzed (ISO date)`
            },
            {
              role: "user",
              content: JSON.stringify({
                patientId,
                healthData,
                currentDate: new Date().toISOString()
              })
            }
          ],
          response_format: { type: "json_object" }
        });
      });

      if (!response.choices[0].message.content) {
        throw new Error("Invalid AI response");
      }

      const result = JSON.parse(response.choices[0].message.content);

      return {
        insights: result.insights || [],
        urgentActions: result.urgentActions || [],
        lastAnalyzed: result.lastAnalyzed || new Date().toISOString(),
        riskFactors: result.riskFactors || [],
        recommendedTests: result.recommendedTests || []
      };
    } catch (error) {
      console.error('Health Insights error:', error);

      return {
        insights: ['Health insights are temporarily unavailable'],
        urgentActions: [],
        lastAnalyzed: new Date().toISOString(),
        riskFactors: [],
        recommendedTests: []
      };
    }
  }
}