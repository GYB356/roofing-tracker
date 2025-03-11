import { A11yAppScanner } from './utils/a11yAppScanner';
import { A11yAuditService } from './a11yAuditService';
import { A11yScanResult, A11ySeverity } from '../types/a11y';

export class A11yAuditSystem {
  private static instance: A11yAuditSystem;
  private scanInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  /**
   * Singleton instance getter
   */
  public static getInstance(): A11yAuditSystem {
    if (!A11yAuditSystem.instance) {
      A11yAuditSystem.instance = new A11yAuditSystem();
    }
    return A11yAuditSystem.instance;
  }

  /**
   * Start periodic accessibility scanning
   * @param intervalMinutes Scanning interval in minutes
   */
  startPeriodicScanning(intervalMinutes: number = 60): void {
    if (this.scanInterval) {
      this.stopPeriodicScanning();
    }

    this.scanInterval = setInterval(async () => {
      await this.runComprehensiveScan();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop periodic scanning
   */
  stopPeriodicScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  /**
   * Run a comprehensive accessibility scan
   */
  async runComprehensiveScan(): Promise<A11yScanResult> {
    const scanResult = await A11yAppScanner.scanApplication();
    
    // Report results
    await A11yAuditService.reportScanResults(scanResult);

    // Trigger notifications for critical issues
    this.notifyOnCriticalIssues(scanResult);

    return scanResult;
  }

  /**
   * Notify stakeholders about critical accessibility issues
   * @param scanResult Accessibility scan results
   */
  private notifyOnCriticalIssues(scanResult: A11yScanResult): void {
    const criticalIssues = scanResult.issues.filter(
      issue => issue.severity === A11ySeverity.CRITICAL
    );

    if (criticalIssues.length > 0) {
      // Could integrate with email, Slack, or other notification systems
      console.warn('Critical Accessibility Issues Detected:', criticalIssues);
      
      // Example of how you might send a notification
      this.sendNotification({
        title: 'Critical A11y Issues Found',
        message: `${criticalIssues.length} critical accessibility issues detected`,
        issues: criticalIssues
      });
    }
  }

  /**
   * Send notification about accessibility issues
   * @param notification Notification details
   */
  private sendNotification(notification: {
    title: string;
    message: string;
    issues?: any[];
  }): void {
    // Placeholder for actual notification logic
    // Could integrate with services like Slack, email, or internal notification system
    console.log('Accessibility Notification:', notification);
  }

  /**
   * Generate an accessibility compliance report
   */
  async generateComplianceReport(): Promise<string> {
    const historicalResults = await A11yAuditService.getHistoricalResults(5);
    const currentScore = await A11yAuditService.getCurrentScore();

    const reportContent = `
Accessibility Compliance Report
===============================

Current Accessibility Score: ${currentScore}%

Historical Scan Results:
${historicalResults.map((result, index) => `
Scan ${index + 1}:
- Timestamp: ${result.timestamp}
- Total Issues: ${result.totalIssues}
- Critical Issues: ${result.criticalIssues}
- Score: ${result.score}%
`).join('\n')}

Recommendations:
1. Address critical and high-severity issues promptly
2. Conduct manual accessibility testing
3. Implement regular automated and manual audits
`;

    return reportContent;
  }
}

// Export a singleton instance for easy access
export const a11yAuditSystem = A11yAuditSystem.getInstance();