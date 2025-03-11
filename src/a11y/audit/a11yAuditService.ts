import { 
  runA11yAudit, 
  runComponentAudit, 
  A11yAuditResult, 
  A11yAuditOptions,
  generateViolationSummary 
} from './a11yAudit';

/**
 * Interface for audit history entry
 */
export interface A11yAuditHistoryEntry {
  id: string;
  timestamp: Date;
  component?: string;
  violationCount: number;
  criticalCount: number;
  seriousCount: number;
  passCount: number;
  incompleteCount: number;
  results: A11yAuditResult;
}

/**
 * Interface for audit rule
 */
export interface A11yAuditRule {
  id: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  tags: string[];
}

/**
 * Accessibility Audit Service
 * Manages automated a11y audits, audit history, and integration with external systems
 */
export class A11yAuditService {
  private auditHistory: A11yAuditHistoryEntry[] = [];
  private auditRules: A11yAuditRule[] = [];
  private autoAuditEnabled: boolean = false;
  private auditIntervalId: number | null = null;
  private auditInterval: number = 3600000; // Default: 1 hour
  private maxHistoryLength: number = 50;
  private webhookUrl: string | null = null;

  constructor() {
    // Load default audit rules
    this.loadDefaultRules();
    
    // Load audit config from localStorage if available
    this.loadConfiguration();
  }

  /**
   * Load default accessibility audit rules
   */
  private loadDefaultRules(): void {
    this.auditRules = [
      {
        id: 'color-contrast',
        description: 'Elements must have sufficient color contrast',
        enabled: true,
        severity: 'serious',
        tags: ['wcag2aa', 'wcag143', 'cat.color'],
      },
      {
        id: 'keyboard-nav',
        description: 'All page functionality should be available using the keyboard',
        enabled: true,
        severity: 'critical',
        tags: ['wcag2a', 'wcag211', 'cat.keyboard'],
      },
      {
        id: 'aria-required-attr',
        description: 'ARIA elements must have all required attributes',
        enabled: true,
        severity: 'critical',
        tags: ['wcag2a', 'wcag412', 'cat.aria'],
      },
      {
        id: 'document-title',
        description: 'Documents must have a title element to aid navigation',
        enabled: true,
        severity: 'serious',
        tags: ['wcag2a', 'wcag242', 'cat.semantics'],
      },
      {
        id: 'image-alt',
        description: 'Images must have alternate text',
        enabled: true,
        severity: 'critical',
        tags: ['wcag2a', 'wcag111', 'cat.text-alternatives'],
      },
      // Add more default rules as needed
    ];
  }

  /**
   * Load audit configuration from localStorage
   */
  private loadConfiguration(): void {
    try {
      const config = localStorage.getItem('a11yAuditConfig');
      if (config) {
        const parsedConfig = JSON.parse(config);
        this.autoAuditEnabled = parsedConfig.autoAuditEnabled || false;
        this.auditInterval = parsedConfig.auditInterval || 3600000;
        this.maxHistoryLength = parsedConfig.maxHistoryLength || 50;
        this.webhookUrl = parsedConfig.webhookUrl || null;
        
        // Restore audit rules if available
        if (parsedConfig.auditRules) {
          this.auditRules = parsedConfig.auditRules;
        }
        
        // If auto audit was enabled, start it
        if (this.autoAuditEnabled) {
          this.startAutoAudit();
        }
      }
    } catch (error) {
      console.error('Failed to load a11y audit configuration:', error);
    }
  }

  /**
   * Save audit configuration to localStorage
   */
  private saveConfiguration(): void {
    try {
      const config = {
        autoAuditEnabled: this.autoAuditEnabled,
        auditInterval: this.auditInterval,
        maxHistoryLength: this.maxHistoryLength,
        webhookUrl: this.webhookUrl,
        auditRules: this.auditRules,
      };
      
      localStorage.setItem('a11yAuditConfig', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save a11y audit configuration:', error);
    }
  }

  /**
   * Build audit options based on the enabled rules
   */
  private buildAuditOptions(): A11yAuditOptions {
    const enabledRules: { [key: string]: { enabled: boolean } } = {};
    
    this.auditRules.forEach((rule) => {
      enabledRules[rule.id] = { enabled: rule.enabled };
    });
    
    return {
      rules: enabledRules,
      reporter: 'v2',
      resultTypes: ['violations', 'incomplete', 'passes'],
    };
  }

  /**
   * Run an audit on the entire page
   */
  public async runPageAudit(): Promise<A11yAuditResult> {
    const options = this.buildAuditOptions();
    const results = await runA11yAudit(document, options);
    
    // Add to history
    this.addToHistory(results);
    
    // Send to webhook if configured
    if (this.webhookUrl) {
      this.sendToWebhook(results);
    }
    
    return results;
  }

  /**
   * Run an audit on a specific component
   * 
   * @param componentRef - Reference to the component to audit
   * @param componentName - Name of the component
   */
  public async runComponentAudit(
    componentRef: React.RefObject<HTMLElement>,
    componentName: string
  ): Promise<A11yAuditResult> {
    const options = this.buildAuditOptions();
    const results = await runComponentAudit(componentRef, componentName, options);
    
    // Add to history
    this.addToHistory(results);
    
    // Send to webhook if configured
    if (this.webhookUrl) {
      this.sendToWebhook(results);
    }
    
    return results;
  }

  /**
   * Add audit results to history
   * 
   * @param results - The audit results to add
   */
  private addToHistory(results: A11yAuditResult): void {
    // Count violations by severity
    const criticalCount = results.violations.filter(v => v.impact === 'critical').length;
    const seriousCount = results.violations.filter(v => v.impact === 'serious').length;
    
    // Create history entry
    const historyEntry: A11yAuditHistoryEntry = {
      id: `audit-${Date.now()}`,
      timestamp: results.timestamp,
      component: results.component,
      violationCount: results.violations.length,
      criticalCount,
      seriousCount,
      passCount: results.passes.length,
      incompleteCount: results.incomplete.length,
      results,
    };
    
    // Add to history
    this.auditHistory.unshift(historyEntry);
    
    // Trim history if it exceeds max length
    if (this.auditHistory.length > this.maxHistoryLength) {
      this.auditHistory = this.auditHistory.slice(0, this.maxHistoryLength);
    }
    
    // Log results to console in development environment
    if (process.env.NODE_ENV === 'development') {
      console.group('A11y Audit Results');
      console.log(`Component: ${results.component || 'Page'}`);
      console.log(`Violations: ${results.violations.length}`);
      console.log(`Critical: ${criticalCount}`);
      console.log(`Serious: ${seriousCount}`);
      
      if (results.violations.length > 0) {
        console.group('Violations');
        results.violations.forEach(v => {
          console.group(`${v.impact.toUpperCase()}: ${v.help} (${v.id})`);
          console.log(`Description: ${v.description}`);
          console.log(`Help URL: ${v.helpUrl}`);
          console.log(`Affected Elements: ${v.nodes.length}`);
          console.groupEnd();
        });
        console.groupEnd();
      }
      
      console.groupEnd();
    }
  }

  /**
   * Send audit results to webhook
   * 
   * @param results - The audit results to send
   */
  private async sendToWebhook(results: A11yAuditResult): Promise<void> {
    if (!this.webhookUrl) return;
    
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: results.timestamp,
          component: results.component || 'Page',
          url: results.url,
          violationCount: results.violations.length,
          criticalCount: results.violations.filter(v => v.impact === 'critical').length,
          seriousCount: results.violations.filter(v => v.impact === 'serious').length,
          summary: generateViolationSummary(results),
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to send a11y audit results to webhook:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending a11y audit results to webhook:', error);
    }
  }

  /**
   * Start automatic auditing at regular intervals
   * 
   * @param interval - Interval in milliseconds (defaults to configured interval)
   */
  public startAutoAudit(interval?: number): void {
    // Stop any existing auto audit
    this.stopAutoAudit();
    
    // Set new interval if provided
    if (interval) {
      this.auditInterval = interval;
      this.saveConfiguration();
    }
    
    // Start new interval
    this.autoAuditEnabled = true;
    this.auditIntervalId = window.setInterval(() => {
      this.runPageAudit();
    }, this.auditInterval);
    
    // Save configuration
    this.saveConfiguration();
    
    console.log(`Automatic a11y auditing started (every ${this.auditInterval / 60000} minutes)`);
  }

  /**
   * Stop automatic auditing
   */
  public stopAutoAudit(): void {
    if (this.auditIntervalId !== null) {
      clearInterval(this.auditIntervalId);
      this.auditIntervalId = null;
    }
    
    this.autoAuditEnabled = false;
    this.saveConfiguration();
    
    console.log('Automatic a11y auditing stopped');
  }

  /**
   * Get audit history
   */
  public getAuditHistory(): A11yAuditHistoryEntry[] {
    return [...this.auditHistory];
  }

  /**
   * Clear audit history
   */
  public clearAuditHistory(): void {
    this.auditHistory = [];
  }

  /**
   * Get audit rules
   */
  public getAuditRules(): A11yAuditRule[] {
    return [...this.auditRules];
  }

  /**
   * Update an audit rule
   * 
   * @param ruleId - ID of the rule to update
   * @param updates - Updates to apply to the rule
   */
  public updateAuditRule(
    ruleId: string,
    updates: Partial<Omit<A11yAuditRule, 'id'>>
  ): void {
    const ruleIndex = this.auditRules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex !== -1) {
      this.auditRules[ruleIndex] = {
        ...this.auditRules[ruleIndex],
        ...updates,
      };
      
      this.saveConfiguration();
    }
  }

  /**
   * Add a new audit rule
   * 
   * @param rule - Rule to add
   */
  public addAuditRule(rule: A11yAuditRule): void {
    // Check if rule already exists
    const existingRule = this.auditRules.find(r => r.id === rule.id);
    
    if (!existingRule) {
      this.auditRules.push(rule);
      this.saveConfiguration();
    }
  }

  /**
   * Remove an audit rule
   * 
   * @param ruleId - ID of the rule to remove
   */
  public removeAuditRule(ruleId: string): void {
    this.auditRules = this.auditRules.filter(rule => rule.id !== ruleId);
    this.saveConfiguration();
  }

  /**
   * Set webhook URL for sending audit results
   * 
   * @param url - Webhook URL
   */
  public setWebhookUrl(url: string | null): void {
    this.webhookUrl = url;
    this.saveConfiguration();
  }

  /**
   * Set maximum history length
   * 
   * @param length - Maximum number of history entries to keep
   */
  public setMaxHistoryLength(length: number): void {
    this.maxHistoryLength = length;
    
    // Trim history if it exceeds new max length
    if (this.auditHistory.length > this.maxHistoryLength) {
      this.auditHistory = this.auditHistory.slice(0, this.maxHistoryLength);
    }
    
    this.saveConfiguration();
  }
}

// Export singleton instance
export const a11yAuditService = new A11yAuditService();

export default a11yAuditService; 