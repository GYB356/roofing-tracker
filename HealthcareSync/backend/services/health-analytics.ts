
import { openai } from './openai-service';
import { storage } from '../storage';

export interface HealthMetric {
  name: string;
  value: string | number;
  status: 'normal' | 'warning' | 'critical';
  trend?: 'improving' | 'stable' | 'worsening';
}

export interface HealthSummary {
  overview: string;
  metrics: HealthMetric[];
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high';
}

export class HealthAnalyticsService {
  static async generatePatientSummary(patientId: number): Promise<HealthSummary> {
    try {
      // Get patient data
      const patient = await storage.getPatient(patientId);
      const appointments = await storage.getAppointmentsByPatientId(patientId);
      const medicalRecords = await storage.getMedicalRecordsByPatientId(patientId);
      const assessments = await storage.getAssessmentsByPatientId(patientId);
      
      // If no patient data is found, return a basic summary
      if (!patient) {
        return {
          overview: "Patient data not found",
          metrics: [],
          recommendations: ["Complete your health profile"],
          riskLevel: "low"
        };
      }

      // For demonstration, create some mock metrics
      // In a real system, these would be extracted from medical records
      const mockMetrics: HealthMetric[] = [
        {
          name: "Blood Pressure",
          value: "120/80",
          status: "normal",
          trend: "stable"
        },
        {
          name: "Heart Rate",
          value: 72,
          status: "normal",
          trend: "stable"
        },
        {
          name: "Temperature",
          value: "98.6°F",
          status: "normal",
          trend: "stable"
        }
      ];
      
      // If you have AI integration, use it for recommendations
      let recommendations: string[] = ["Schedule regular check-ups", "Maintain a healthy diet"];
      let overview = "Your health appears to be in good condition based on your records.";
      let riskLevel: 'low' | 'moderate' | 'high' = "low";
      
      // If the patient has assessments with high urgency, reflect that in the summary
      const urgentAssessments = assessments.filter(a => 
        a.urgencyLevel === "urgent" || a.urgencyLevel === "emergency"
      );
      
      if (urgentAssessments.length > 0) {
        riskLevel = "high";
        overview = "There are some concerning health indicators that require attention.";
        recommendations = ["Consult with your doctor immediately", "Monitor your symptoms closely"];
      }

      return {
        overview,
        metrics: mockMetrics,
        recommendations,
        riskLevel
      };
    } catch (error) {
      console.error("Error generating health summary:", error);
      return {
        overview: "Unable to generate health summary at this time",
        metrics: [],
        recommendations: ["Please try again later"],
        riskLevel: "low"
      };
    }
  }
  
  static async getHealthInsights(patientId: number) {
    try {
      // Get patient data
      const patient = await storage.getPatient(patientId);
      
      // Mock AI response for now
      return {
        insights: [
          "Regular exercise can help improve your overall health",
          "Based on your records, maintaining hydration is important",
          "Your sleep patterns indicate possible improvement areas"
        ],
        urgentActions: []
      };
      
      // Uncomment to use actual OpenAI integration when ready
      /*
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a healthcare AI assistant. Provide key health insights and any urgent actions needed 
            based on the patient's recent health metrics and history. Respond with a JSON object containing 
            insights array and urgentActions array.`
          },
          {
            role: "user",
            content: `Analyze health data for patient ${patientId}`
          }
        ],
        response_format: { type: "json_object" }
      });

      if (!response.choices[0].message.content) {
        throw new Error("Invalid AI response");
      }

      const result = JSON.parse(response.choices[0].message.content);

      return {
        insights: result.insights || [],
        urgentActions: result.urgentActions || []
      };
      */
    } catch (error) {
      console.error('Health Insights error:', error);

      // Return a fallback response when the API fails
      return {
        insights: ['Health insights are temporarily unavailable'],
        urgentActions: []
      };
    }
  }
}
