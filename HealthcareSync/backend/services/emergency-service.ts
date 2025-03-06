import { WebSocket } from 'ws';
import { prisma } from '../../lib/prisma';
import { NotificationService } from './notification-service';

export interface VitalSign {
  patientId: number;
  type: 'heart_rate' | 'blood_pressure' | 'oxygen_level' | 'temperature';
  value: number;
  unit: string;
  timestamp: string;
}

export interface AlertThreshold {
  type: 'heart_rate' | 'blood_pressure' | 'oxygen_level' | 'temperature';
  min?: number;
  max?: number;
  critical_min?: number;
  critical_max?: number;
  trend_duration?: number; // Duration in minutes to analyze trend
  trend_threshold?: number; // Percentage change that triggers an alert
}

export class EmergencyService {
  private static vitalSignThresholds = new Map<number, AlertThreshold[]>();
  private static vitalSignHistory = new Map<number, Map<string, VitalSign[]>>();

  static async monitorVitalSigns(vitalSign: VitalSign): Promise<void> {
    // Store vital sign in history
    this.updateVitalSignHistory(vitalSign);

    // Get patient's thresholds
    const thresholds = this.vitalSignThresholds.get(vitalSign.patientId) || [];
    const threshold = thresholds.find(t => t.type === vitalSign.type);

    if (threshold) {
      const alertTriggers = [];

      // Check critical thresholds
      if (
        (threshold.critical_max && vitalSign.value > threshold.critical_max) ||
        (threshold.critical_min && vitalSign.value < threshold.critical_min)
      ) {
        alertTriggers.push('CRITICAL_THRESHOLD');
      }
      // Check warning thresholds
      else if (
        (threshold.max && vitalSign.value > threshold.max) ||
        (threshold.min && vitalSign.value < threshold.min)
      ) {
        alertTriggers.push('WARNING_THRESHOLD');
      }

      // Check rapid changes if trend monitoring is configured
      if (threshold.trend_duration && threshold.trend_threshold) {
        const trendAlert = await this.checkVitalSignTrend(
          vitalSign,
          threshold.trend_duration,
          threshold.trend_threshold
        );
        if (trendAlert) {
          alertTriggers.push('RAPID_CHANGE');
        }
      }

      // Trigger alerts if any conditions were met
      if (alertTriggers.length > 0) {
        await this.triggerEmergencyAlert(vitalSign, alertTriggers);
      }
    }
  }

  private static updateVitalSignHistory(vitalSign: VitalSign): void {
    if (!this.vitalSignHistory.has(vitalSign.patientId)) {
      this.vitalSignHistory.set(vitalSign.patientId, new Map());
    }

    const patientHistory = this.vitalSignHistory.get(vitalSign.patientId)!;
    if (!patientHistory.has(vitalSign.type)) {
      patientHistory.set(vitalSign.type, []);
    }

    const typeHistory = patientHistory.get(vitalSign.type)!;
    typeHistory.push(vitalSign);

    // Keep last 24 hours of data
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const filteredHistory = typeHistory.filter(vs => vs.timestamp >= oneDayAgo);
    patientHistory.set(vitalSign.type, filteredHistory);
  }

  private static async checkVitalSignTrend(
    currentVitalSign: VitalSign,
    duration: number,
    threshold: number
  ): Promise<boolean> {
    const patientHistory = this.vitalSignHistory.get(currentVitalSign.patientId);
    if (!patientHistory) return false;

    const typeHistory = patientHistory.get(currentVitalSign.type);
    if (!typeHistory) return false;

    const timeThreshold = new Date(Date.now() - duration * 60 * 1000).toISOString();
    const recentReadings = typeHistory.filter(vs => vs.timestamp >= timeThreshold);

    if (recentReadings.length < 2) return false;

    const oldestValue = recentReadings[0].value;
    const percentageChange = Math.abs((currentVitalSign.value - oldestValue) / oldestValue * 100);

    return percentageChange >= threshold;
  }

  static async triggerEmergencyAlert(vitalSign: VitalSign, triggers: string[]): Promise<void> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: vitalSign.patientId },
        include: { assignedDoctor: true }
      });

      if (!patient) return;

      const alertPriority = triggers.includes('CRITICAL_THRESHOLD') ? 'critical' : 'high';
      const alertTitle = `${alertPriority.toUpperCase()} Alert - ${patient.firstName} ${patient.lastName}`;
      const triggerDescriptions = {
        CRITICAL_THRESHOLD: 'Critical threshold exceeded',
        WARNING_THRESHOLD: 'Warning threshold exceeded',
        RAPID_CHANGE: 'Rapid change detected'
      };

      const alertMessage = `${vitalSign.type.replace('_', ' ')} reading of ${vitalSign.value}${vitalSign.unit} - ${triggers.map(t => triggerDescriptions[t]).join(', ')}`;

      // Create emergency alert
      const alert = await prisma.notification.create({
        data: {
          type: 'ALERT',
          title: alertTitle,
          message: alertMessage,
          userId: patient.assignedDoctorId,
          metadata: {
            priority: alertPriority,
            patientId: patient.id,
            vitalType: vitalSign.type,
            value: vitalSign.value,
            unit: vitalSign.unit,
            timestamp: vitalSign.timestamp,
            triggers: triggers
          }
        }
      });

      // Send notification to assigned doctor
      await NotificationService.sendNotification({
        userId: patient.assignedDoctorId,
        type: 'health',
        title: alert.title,
        message: alert.message,
        priority: alertPriority
      });

      // Log emergency event
      await prisma.emergencyLog.create({
        data: {
          patientId: patient.id,
          vitalType: vitalSign.type,
          value: vitalSign.value,
          unit: vitalSign.unit,
          timestamp: vitalSign.timestamp,
          alertId: alert.id,
          triggers: triggers
        }
      });
    } catch (error) {
      console.error('Error triggering emergency alert:', error);
    }
  }

  static setVitalSignThresholds(patientId: number, thresholds: AlertThreshold[]): void {
    this.vitalSignThresholds.set(patientId, thresholds);
  }

  static getVitalSignThresholds(patientId: number): AlertThreshold[] {
    return this.vitalSignThresholds.get(patientId) || [];
  }

  static clearOldHistory(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    this.vitalSignHistory.forEach((patientHistory, patientId) => {
      patientHistory.forEach((typeHistory, type) => {
        const filteredHistory = typeHistory.filter(vs => vs.timestamp >= oneDayAgo);
        patientHistory.set(type, filteredHistory);
      });
    });
  }
}