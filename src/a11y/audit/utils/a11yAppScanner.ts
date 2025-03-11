import { a11yAuditService } from '../a11yAuditService';
import { A11yAuditResult } from '../a11yAudit';
import { generateReport, ReportFormat } from './a11yAuditReport';

/**
 * Route definition for scanning
 */
export interface RouteDefinition {
  path: string;
  name: string;
  component?: string;
  childRoutes?: RouteDefinition[];
}

/**
 * Options for scanning a route
 */
export interface RouteScanOptions {
  // Wait time before scanning (ms)
  waitTime?: number;
  
  // Interactions to perform before scanning
  interactions?: RouteInteraction[];
  
  // Selector to focus scanning on
  focusSelector?: string;
  
  // Custom name for the route audit
  customName?: string;
}

/**
 * Route interaction definition
 */
export interface RouteInteraction {
  // Type of interaction
  type: 'click' | 'input' | 'select' | 'hover' | 'wait' | 'scroll' | 'custom';
  
  // Selector for the element to interact with
  selector?: string;
  
  // Value for input or select interactions
  value?: string;
  
  // Wait time after interaction (ms)
  waitAfter?: number;
  
  // Custom function for custom interactions
  customAction?: () => Promise<void>;
}

/**
 * Scan result for a route
 */
export interface RouteScanResult {
  route: RouteDefinition;
  auditResult: A11yAuditResult;
  violationsCount: number;
  criticalCount: number;
  seriousCount: number;
  timestamp: Date;
}

/**
 * Options for scanning the application
 */
export interface AppScanOptions {
  // Base URL for the application
  baseUrl?: string;
  
  // Whether to include nested routes
  includeNestedRoutes?: boolean;
  
  // Default wait time before scanning each route (ms)
  defaultWaitTime?: number;
  
  // Whether to generate a report after scanning
  generateReport?: boolean;
  
  // Format for the report
  reportFormat?: ReportFormat;
  
  // Default scan options for routes
  defaultRouteScanOptions?: Partial<RouteScanOptions>;
  
  // Route-specific scan options
  routeScanOptions?: Record<string, RouteScanOptions>;
  
  // Callback for route scan completion
  onRouteScanComplete?: (result: RouteScanResult) => void;
  
  // Callback for scan progress
  onScanProgress?: (completed: number, total: number) => void;
}

/**
 * Application scan result
 */
export interface AppScanResult {
  scanStartTime: Date;
  scanEndTime: Date;
  routeResults: RouteScanResult[];
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  report?: string;
}

/**
 * A11y Application Scanner
 * Scans an entire application for accessibility issues by navigating routes
 */
export class A11yAppScanner {
  private routes: RouteDefinition[];
  private scanOptions: AppScanOptions;
  private scanResults: RouteScanResult[] = [];
  private totalRoutes: number = 0;
  private completedRoutes: number = 0;
  private isScanning: boolean = false;
  
  /**
   * Create a new instance of the A11y App Scanner
   * 
   * @param routes - Route definitions to scan
   * @param options - Scan options
   */
  constructor(routes: RouteDefinition[], options: AppScanOptions = {}) {
    this.routes = routes;
    this.scanOptions = {
      baseUrl: options.baseUrl || window.location.origin,
      includeNestedRoutes: options.includeNestedRoutes ?? true,
      defaultWaitTime: options.defaultWaitTime ?? 1000,
      generateReport: options.generateReport ?? true,
      reportFormat: options.reportFormat ?? 'html',
      defaultRouteScanOptions: options.defaultRouteScanOptions || {},
      routeScanOptions: options.routeScanOptions || {},
      onRouteScanComplete: options.onRouteScanComplete,
      onScanProgress: options.onScanProgress,
    };
    
    // Count total routes
    this.totalRoutes = this.countRoutes(this.routes);
  }
  
  /**
   * Count total routes including nested routes if enabled
   */
  private countRoutes(routes: RouteDefinition[]): number {
    let count = routes.length;
    
    if (this.scanOptions.includeNestedRoutes) {
      for (const route of routes) {
        if (route.childRoutes && route.childRoutes.length > 0) {
          count += this.countRoutes(route.childRoutes);
        }
      }
    }
    
    return count;
  }
  
  /**
   * Start scanning all routes
   */
  public async startScan(): Promise<AppScanResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }
    
    this.isScanning = true;
    this.scanResults = [];
    this.completedRoutes = 0;
    
    const scanStartTime = new Date();
    
    try {
      // Scan all routes
      for (const route of this.routes) {
        await this.scanRoute(route);
      }
      
      // Calculate total violations
      const totalViolations = this.scanResults.reduce(
        (sum, result) => sum + result.violationsCount, 
        0
      );
      
      // Calculate critical violations
      const criticalViolations = this.scanResults.reduce(
        (sum, result) => sum + result.criticalCount, 
        0
      );
      
      // Calculate serious violations
      const seriousViolations = this.scanResults.reduce(
        (sum, result) => sum + result.seriousCount, 
        0
      );
      
      const scanEndTime = new Date();
      
      // Generate final report if requested
      let report: string | undefined;
      
      if (this.scanOptions.generateReport && this.scanResults.length > 0) {
        report = this.generateAppReport();
      }
      
      const scanResult: AppScanResult = {
        scanStartTime,
        scanEndTime,
        routeResults: this.scanResults,
        totalViolations,
        criticalViolations,
        seriousViolations,
        report,
      };
      
      return scanResult;
    } finally {
      this.isScanning = false;
    }
  }
  
  /**
   * Scan a single route and its child routes if enabled
   */
  private async scanRoute(route: RouteDefinition, parentPath: string = ''): Promise<void> {
    // Combine parent path with route path
    const fullPath = `${parentPath}${route.path}`;
    
    // Get route-specific options
    const routeOptions: RouteScanOptions = {
      ...this.scanOptions.defaultRouteScanOptions,
      ...this.scanOptions.routeScanOptions?.[route.path],
    };
    
    // Navigate to the route
    await this.navigateToRoute(fullPath);
    
    // Perform pre-scan interactions
    if (routeOptions.interactions && routeOptions.interactions.length > 0) {
      await this.performInteractions(routeOptions.interactions);
    }
    
    // Wait before scanning
    await this.wait(routeOptions.waitTime || this.scanOptions.defaultWaitTime);
    
    // Run the audit
    const auditResult = await this.auditRoute(route, routeOptions);
    
    // Count violations
    const violationsCount = auditResult.violations.length;
    const criticalCount = auditResult.violations.filter(v => v.impact === 'critical').length;
    const seriousCount = auditResult.violations.filter(v => v.impact === 'serious').length;
    
    // Create scan result
    const routeScanResult: RouteScanResult = {
      route,
      auditResult,
      violationsCount,
      criticalCount,
      seriousCount,
      timestamp: new Date(),
    };
    
    // Add to results
    this.scanResults.push(routeScanResult);
    
    // Increment completed count
    this.completedRoutes++;
    
    // Call progress callback
    if (this.scanOptions.onScanProgress) {
      this.scanOptions.onScanProgress(this.completedRoutes, this.totalRoutes);
    }
    
    // Call route scan complete callback
    if (this.scanOptions.onRouteScanComplete) {
      this.scanOptions.onRouteScanComplete(routeScanResult);
    }
    
    // Scan child routes if enabled
    if (
      this.scanOptions.includeNestedRoutes && 
      route.childRoutes && 
      route.childRoutes.length > 0
    ) {
      for (const childRoute of route.childRoutes) {
        await this.scanRoute(childRoute, fullPath);
      }
    }
  }
  
  /**
   * Navigate to a route
   */
  private async navigateToRoute(path: string): Promise<void> {
    // Combine base URL with path
    const url = new URL(path, this.scanOptions.baseUrl);
    
    try {
      // Use History API if on same origin
      if (url.origin === window.location.origin) {
        window.history.pushState({}, '', url.toString());
        
        // Dispatch popstate event to trigger route change
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      } else {
        // If different origin, use window.location (causes page reload)
        window.location.href = url.toString();
      }
      
      // Wait for navigation to complete
      await this.wait(500);
    } catch (error) {
      console.error(`Error navigating to route ${path}:`, error);
    }
  }
  
  /**
   * Perform interactions on the page
   */
  private async performInteractions(interactions: RouteInteraction[]): Promise<void> {
    for (const interaction of interactions) {
      try {
        switch (interaction.type) {
          case 'click':
            await this.clickElement(interaction.selector);
            break;
          case 'input':
            await this.inputText(interaction.selector, interaction.value);
            break;
          case 'select':
            await this.selectOption(interaction.selector, interaction.value);
            break;
          case 'hover':
            await this.hoverElement(interaction.selector);
            break;
          case 'wait':
            await this.wait(interaction.waitAfter || 1000);
            break;
          case 'scroll':
            await this.scrollElement(interaction.selector);
            break;
          case 'custom':
            if (interaction.customAction) {
              await interaction.customAction();
            }
            break;
        }
        
        // Wait after interaction if specified
        if (interaction.waitAfter && interaction.type !== 'wait') {
          await this.wait(interaction.waitAfter);
        }
      } catch (error) {
        console.error(`Error performing interaction ${interaction.type}:`, error);
      }
    }
  }
  
  /**
   * Click an element
   */
  private async clickElement(selector?: string): Promise<void> {
    if (!selector) return;
    
    const element = document.querySelector(selector) as HTMLElement;
    
    if (element) {
      element.click();
    } else {
      console.warn(`Element not found: ${selector}`);
    }
  }
  
  /**
   * Input text into an element
   */
  private async inputText(selector?: string, value?: string): Promise<void> {
    if (!selector || value === undefined) return;
    
    const element = document.querySelector(selector) as HTMLInputElement;
    
    if (element) {
      element.value = value;
      
      // Dispatch input and change events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      console.warn(`Element not found: ${selector}`);
    }
  }
  
  /**
   * Select an option from a select element
   */
  private async selectOption(selector?: string, value?: string): Promise<void> {
    if (!selector || value === undefined) return;
    
    const element = document.querySelector(selector) as HTMLSelectElement;
    
    if (element) {
      element.value = value;
      
      // Dispatch change event
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      console.warn(`Element not found: ${selector}`);
    }
  }
  
  /**
   * Hover over an element
   */
  private async hoverElement(selector?: string): Promise<void> {
    if (!selector) return;
    
    const element = document.querySelector(selector) as HTMLElement;
    
    if (element) {
      // Dispatch mouseenter and mouseover events
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    } else {
      console.warn(`Element not found: ${selector}`);
    }
  }
  
  /**
   * Scroll an element into view
   */
  private async scrollElement(selector?: string): Promise<void> {
    if (!selector) {
      // Scroll to bottom of page if no selector
      window.scrollTo(0, document.body.scrollHeight);
      return;
    }
    
    const element = document.querySelector(selector) as HTMLElement;
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`Element not found: ${selector}`);
    }
  }
  
  /**
   * Wait for a specified time
   */
  private async wait(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Audit a route
   */
  private async auditRoute(
    route: RouteDefinition,
    options: RouteScanOptions
  ): Promise<A11yAuditResult> {
    // Determine audit target
    let auditTarget: Document | Element = document;
    
    if (options.focusSelector) {
      const element = document.querySelector(options.focusSelector);
      if (element) {
        auditTarget = element;
      }
    }
    
    // Determine component name
    const componentName = options.customName || 
      route.component || 
      `Route: ${route.name || route.path}`;
    
    try {
      // Run the audit
      const auditResult = await a11yAuditService['runA11yAudit'](
        auditTarget,
        {}
      );
      
      // Add component name and URL to results
      return {
        ...auditResult,
        component: componentName,
        url: window.location.href,
      };
    } catch (error) {
      console.error(`Error auditing route ${route.path}:`, error);
      
      // Return empty result on error
      return {
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: [],
        timestamp: new Date(),
        url: window.location.href,
        component: componentName,
      };
    }
  }
  
  /**
   * Generate a report for the entire application
   */
  private generateAppReport(): string {
    // Combine all route results into one
    const combinedResult: A11yAuditResult = {
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
      timestamp: new Date(),
      url: this.scanOptions.baseUrl || window.location.href,
    };
    
    // Add all violations from all routes
    for (const result of this.scanResults) {
      // Add route name to each violation
      const routeViolations = result.auditResult.violations.map(violation => ({
        ...violation,
        route: result.route.name || result.route.path,
      }));
      
      combinedResult.violations.push(...routeViolations);
      
      // Track passes too if needed
      if (this.scanOptions.reportFormat !== 'csv') {
        combinedResult.passes.push(...result.auditResult.passes);
        combinedResult.incomplete.push(...result.auditResult.incomplete);
      }
    }
    
    // Generate the report
    return generateReport(combinedResult, {
      format: this.scanOptions.reportFormat,
      title: 'Application Accessibility Audit Report',
      includePassingRules: true,
    });
  }
  
  /**
   * Check if a scan is in progress
   */
  public isScanning(): boolean {
    return this.isScanning;
  }
  
  /**
   * Get scan progress
   */
  public getScanProgress(): { completed: number; total: number; percentage: number } {
    const percentage = this.totalRoutes > 0 
      ? Math.round((this.completedRoutes / this.totalRoutes) * 100) 
      : 0;
    
    return {
      completed: this.completedRoutes,
      total: this.totalRoutes,
      percentage,
    };
  }
  
  /**
   * Cancel the current scan
   */
  public cancelScan(): void {
    this.isScanning = false;
  }
}

export default A11yAppScanner; 