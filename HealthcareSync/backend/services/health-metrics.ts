import { db } from "../db";
import { healthMetrics } from "@shared/schema";
import { websocketService } from "./websocket-service";
import { eq } from "drizzle-orm";

export class HealthMetricsService {
  /**
   * Create a new health metric entry and notify connected clients
   */
  static async createHealthMetric(data: {
    patientId: number;
    type: string;
    value: string;
    unit: string;
    notes?: string;
  }) {
    try {
      // Insert into database
      const [newMetric] = await db.insert(healthMetrics).values({
        ...data,
        timestamp: new Date(),
      }).returning();

      // Notify relevant parties via WebSocket
      if (websocketService) {
        const metricUpdate = {
          type: data.type,
          value: data.value,
          unit: data.unit,
          timestamp: new Date().toISOString(),
          patientId: data.patientId
        };

        // Notify the patient
        websocketService.notifyUser(data.patientId, {
          type: 'health_metric_update',
          data: metricUpdate
        });

        // Notify healthcare providers
        websocketService.notifyRole('staff', {
          type: 'patient_health_update',
          patientId: data.patientId,
          data: metricUpdate
        });
      }

      return newMetric;
    } catch (error) {
      console.error('Error creating health metric:', error);
      throw error;
    }
  }

  /**
   * Get health metrics for a patient
   */
  static async getPatientHealthMetrics(patientId: number) {
    return db.select()
      .from(healthMetrics)
      .where(eq(healthMetrics.patientId, patientId))
      .orderBy(healthMetrics.timestamp);
  }

  /**
   * Get health metrics for a patient by type
   */
  static async getPatientHealthMetricsByType(patientId: number, type: string) {
    return db.select()
      .from(healthMetrics)
      .where(eq(healthMetrics.patientId, patientId))
      .where(eq(healthMetrics.type, type))
      .orderBy(healthMetrics.timestamp);
  }

  /**
   * Get health trends for a patient (last 30 days of data)
   */
  static async getPatientHealthTrends(patientId: number) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await db.select()
      .from(healthMetrics)
      .where(eq(healthMetrics.patientId, patientId))
      .where('timestamp', '>=', thirtyDaysAgo)
      .orderBy(healthMetrics.timestamp);

    // Group metrics by type
    const groupedMetrics: Record<string, any[]> = {};

    metrics.forEach(metric => {
      if (!groupedMetrics[metric.type]) {
        groupedMetrics[metric.type] = [];
      }
      groupedMetrics[metric.type].push({
        value: parseFloat(metric.value),
        timestamp: metric.timestamp,
        unit: metric.unit
      });
    });

    // Calculate trends
    const trends: Record<string, {
      current: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      change: number;
      unit: string;
    }> = {};

    Object.entries(groupedMetrics).forEach(([type, values]) => {
      if (values.length >= 2) {
        const sortedValues = [...values].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );

        const current = sortedValues[0].value;
        const previous = sortedValues[sortedValues.length - 1].value;
        const change = ((current - previous) / previous) * 100;

        trends[type] = {
          current,
          trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
          change: Math.abs(change),
          unit: sortedValues[0].unit
        };
      }
    });

    return trends;
  }
}