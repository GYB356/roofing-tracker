import axe, { AxeResults, Result, NodeResult } from 'axe-core';
import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import chalk from 'chalk';

interface AuditOptions {
  baseUrl: string;
  routes: string[];
  outputDir: string;
  includeScreenshots: boolean;
  waitForSelector?: string;
  waitTimeout?: number;
  rules?: Record<string, { enabled: boolean }>;
  tags?: string[];
  runOnly?: {
    type: 'tag' | 'rule';
    values: string[];
  };
  withAuth?: {
    url: string;
    usernameSelector: string;
    passwordSelector: string;
    submitSelector: string;
    username: string;
    password: string;
  };
}

interface AuditResult {
  route: string;
  url: string;
  timestamp: string;
  results: AxeResults;
  screenshot?: string;
  html?: string;
}

interface ViolationData {
  totalViolations: number;
  routeViolations: Record<string, number>;
  impactCounts: Record<string, number>;
  mostCommonViolations: Array<{
    id: string;
    description: string;
    impact: string;
    count: number;
  }>;
}

/**
 * Comprehensive accessibility audit system that:
 * 1. Crawls your application routes
 * 2. Runs axe-core tests on each page
 * 3. Generates detailed reports with screenshots
 * 4. Provides remediation suggestions
 */
export class A11yAuditSystem {
  private options: AuditOptions;
  private browser: Browser | null = null;
  private results: AuditResult[] = [];
  
  constructor(options: AuditOptions) {
    this.options = {
      waitTimeout: 5000,
      includeScreenshots: true,
      ...options,
    };
    
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }
  
  /**
   * Run a full accessibility audit on all specified routes
   */
  public async runAudit(): Promise<AuditResult[]> {
    console.log(chalk.blue('Starting accessibility audit...'));
    
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      // Handle authentication if provided
      let authCookies = null;
      if (this.options.withAuth) {
        authCookies = await this.handleAuthentication();
      }
      
      // Process each route
      for (const route of this.options.routes) {
        const url = new URL(route, this.options.baseUrl).toString();
        console.log(chalk.yellow(`Auditing: ${url}`));
        
        const page = await this.browser.newPage();
        
        // Set cookies if authenticated
        if (authCookies) {
          await page.setCookie(...authCookies);
        }
        
        // Navigate to the page
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Wait for content to load if selector provided
        if (this.options.waitForSelector) {
          await page.waitForSelector(this.options.waitForSelector, { 
            timeout: this.options.waitTimeout 
          });
        } else {
          await page.waitForTimeout(1000); // Default wait time
        }
        
        // Capture screenshot if enabled
        let screenshot = undefined;
        if (this.options.includeScreenshots) {
          screenshot = await page.screenshot({ encoding: 'base64' }) as string;
        }
        
        // Get the page HTML
        const html = await page.content();
        
        // Run axe analysis
        const results = await this.runAxeAnalysis(page);
        
        // Store results
        this.results.push({
          route,
          url,
          timestamp: new Date().toISOString(),
          results,
          screenshot,
          html,
        });
        
        // Log violations summary
        this.logViolationsSummary(route, results);
        
        await page.close();
      }
      
      // Generate comprehensive report
      await this.generateReport();
      
      console.log(chalk.green('Accessibility audit complete!'));
      return this.results;
      
    } catch (error) {
      console.error(chalk.red('Error during accessibility audit:'), error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
  
  /**
   * Run axe analysis on a page
   */
  private async runAxeAnalysis(page: Page): Promise<AxeResults> {
    // Inject and run axe-core
    await page.addScriptTag({
      path: require.resolve('axe-core/axe.min.js'),
    });
    
    // Configure axe options
    const axeOptions = {
      runOnly: this.options.runOnly,
      rules: this.options.rules,
    };
    
    // Run axe analysis
    return await page.evaluate((options) => {
      return new Promise((resolve) => {
        // @ts-ignore - axe is injected at runtime
        window.axe.run(document, options, (err, results) => {
          if (err) throw err;
          resolve(results);
        });
      });
    }, axeOptions);
  }
  
  /**
   * Handle authentication for protected routes
   */
  private async handleAuthentication(): Promise<any[]> {
    console.log(chalk.blue('Handling authentication...'));
    
    if (!this.browser || !this.options.withAuth) {
      return [];
    }
    
    const { 
      url, 
      usernameSelector, 
      passwordSelector, 
      submitSelector, 
      username, 
      password 
    } = this.options.withAuth;
    
    const page = await this.browser.newPage();
    
    try {
      // Navigate to the login page
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Fill in the login form
      await page.type(usernameSelector, username);
      await page.type(passwordSelector, password);
      
      // Submit the form and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click(submitSelector),
      ]);
      
      // Get the authentication cookies
      const cookies = await page.cookies();
      
      console.log(chalk.green('Authentication successful'));
      return cookies;
    } catch (error) {
      console.error(chalk.red('Authentication failed:'), error);
      return [];
    } finally {
      await page.close();
    }
  }
  
  /**
   * Log violations summary for a route
   */
  private logViolationsSummary(route: string, results: AxeResults): void {
    const violations = results.violations || [];
    
    if (violations.length === 0) {
      console.log(chalk.green(`No violations found on ${route}`));
      return;
    }
    
    console.log(chalk.red(`Found ${violations.length} accessibility violations on ${route}`));
    
    // Group by impact
    const byImpact: Record<string, number> = {};
    
    violations.forEach(violation => {
      const impact = violation.impact || 'minor';
      byImpact[impact] = (byImpact[impact] || 0) + 1;
      
      console.log(
        chalk.yellow(`- ${violation.id} (${impact}): ${violation.help} (${violation.nodes.length} occurrences)`)
      );
    });
    
    // Log impact summary
    Object.entries(byImpact).forEach(([impact, count]) => {
      const color = 
        impact === 'critical' ? chalk.red :
        impact === 'serious' ? chalk.yellow :
        impact === 'moderate' ? chalk.cyan :
        chalk.white;
        
      console.log(color(`  ${impact}: ${count}`));
    });
  }
  
  /**
   * Generate a comprehensive report of the audit results
   */
  private async generateReport(): Promise<void> {
    console.log(chalk.blue('Generating accessibility report...'));
    
    // Create the report directory
    const reportDir = path.join(this.options.outputDir, `report-${Date.now()}`);
    fs.mkdirSync(reportDir, { recursive: true });
    
    // Save raw results as JSON
    fs.writeFileSync(
      path.join(reportDir, 'raw-results.json'),
      JSON.stringify(this.results, null, 2)
    );
    
    // Generate report summary
    const violationData = this.analyzeViolations();
    
    // Create summary file
    this.createSummaryReport(reportDir, violationData);
    
    // Generate detailed reports for each route
    for (const result of this.results) {
      this.createRouteReport(reportDir, result);
    }
    
    // Generate HTML report index
    this.createHtmlReportIndex(reportDir, violationData);
    
    console.log(chalk.green(`Report generated in ${reportDir}`));
  }
  
  /**
   * Analyze violations to extract patterns and statistics
   */
  private analyzeViolations(): ViolationData {
    const totalViolations = this.results.reduce(
      (total, result) => total + (result.results.violations?.length || 0),
      0
    );
    
    // Count violations by route
    const routeViolations: Record<string, number> = {};
    this.results.forEach(result => {
      routeViolations[result.route] = result.results.violations?.length || 0;
    });
    
    // Count by impact
    const impactCounts: Record<string, number> = {};
    this.results.forEach(result => {
      result.results.violations?.forEach(violation => {
        const impact = violation.impact || 'minor';
        impactCounts[impact] = (impactCounts[impact] || 0) + 1;
      });
    });
    
    // Find most common violations
    const violationCounts: Record<string, { 
      id: string;
      description: string;
      impact: string;
      count: number;
    }> = {};
    
    this.results.forEach(result => {
      result.results.violations?.forEach(violation => {
        if (!violationCounts[violation.id]) {
          violationCounts[violation.id] = {
            id: violation.id,
            description: violation.description,
            impact: violation.impact || 'minor',
            count: 0,
          };
        }
        
        violationCounts[violation.id].count += violation.nodes.length;
      });
    });
    
    const mostCommonViolations = Object.values(violationCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalViolations,
      routeViolations,
      impactCounts,
      mostCommonViolations,
    };
  }
  
  /**
   * Create a summary report with violation statistics
   */
  private createSummaryReport(reportDir: string, violationData: ViolationData): void {
    const { 
      totalViolations, 
      routeViolations, 
      impactCounts, 
      mostCommonViolations 
    } = violationData;
    
    const summaryContent = [
      '# Accessibility Audit Summary',
      '',
      `Audit date: ${new Date().toLocaleString()}`,
      `Total routes tested: ${this.results.length}`,
      `Total violations found: ${totalViolations}`,
      '',
      '## Violations by Impact',
      '',
    ];
    
    // Add impact counts
    Object.entries(impactCounts)
      .sort(([impactA], [impactB]) => {
        const impactOrder = ['critical', 'serious', 'moderate', 'minor'];
        return impactOrder.indexOf(impactA) - impactOrder.indexOf(impactB);
      })
      .forEach(([impact, count]) => {
        summaryContent.push(`- ${impact}: ${count}`);
      });
    
    // Add route violations
    summaryContent.push('', '## Violations by Route', '');
    
    Object.entries(routeViolations)
      .sort(([, countA], [, countB]) => countB - countA)
      .forEach(([route, count]) => {
        summaryContent.push(`- ${route}: ${count} violations`);
      });
    
    // Add most common violations
    summaryContent.push('', '## Most Common Violations', '');
    
    mostCommonViolations.forEach(violation => {
      summaryContent.push(
        `### ${violation.id} (${violation.impact})`,
        '',
        `${violation.description}`,
        '',
        `Found ${violation.count} times`,
        ''
      );
    });
    
    // Write summary to file
    fs.writeFileSync(
      path.join(reportDir, 'summary.md'),
      summaryContent.join('\n')
    );
  }
  
  /**
   * Create a detailed report for a specific route
   */
  private createRouteReport(reportDir: string, result: AuditResult): void {
    const routeDirName = result.route.replace(/\//g, '_').replace(/^_/, '');
    const routeDir = path.join(reportDir, 'routes', routeDirName || 'home');
    fs.mkdirSync(routeDir, { recursive: true });
    
    // Save route data
    fs.writeFileSync(
      path.join(routeDir, 'data.json'),
      JSON.stringify({
        ...result,
        screenshot: null, // Exclude screenshot from JSON
        html: null, // Exclude HTML from JSON
      }, null, 2)
    );
    
    // Save screenshot if available
    if (result.screenshot) {
      fs.writeFileSync(
        path.join(routeDir, 'screenshot.png'),
        Buffer.from(result.screenshot, 'base64')
      );
    }
    
    // Save HTML if available
    if (result.html) {
      fs.writeFileSync(
        path.join(routeDir, 'page.html'),
        result.html
      );
    }
    
    // Create violation details markdown
    const violations = result.results.violations || [];
    const routeContent = [
      `# Accessibility Report for ${result.route}`,
      '',
      `URL: ${result.url}`,
      `Timestamp: ${result.timestamp}`,
      `Total violations: ${violations.length}`,
      '',
    ];
    
    // Add violations details
    violations.forEach(violation => {
      routeContent.push(
        `## ${violation.id} - ${violation.impact}`,
        '',
        `**Description:** ${violation.description}`,
        '',
        `**Help:** ${violation.help}`,
        '',
        `**Help URL:** ${violation.helpUrl}`,
        '',
        '**Affected elements:**',
        ''
      );
      
      // Add node details
      violation.nodes.forEach((node, index) => {
        routeContent.push(
          `### Instance ${index + 1}`,
          '',
          '```html',
          node.html,
          '```',
          '',
          `**Failure summary:** ${node.failureSummary}`,
          '',
          '**Suggested Fix:**',
          ...this.generateFixSuggestions(violation.id, node),
          ''
        );
      });
    });
    
    // Write route report to file
    fs.writeFileSync(
      path.join(routeDir, 'report.md'),
      routeContent.join('\n')
    );
    
    // Create HTML report
    this.createRouteHtmlReport(routeDir, result, violations);
  }
  
  /**
   * Generate fix suggestions for a specific violation
   */
  private generateFixSuggestions(ruleId: string, node: NodeResult): string[] {
    const suggestions: string[] = [];
    
    // Common fixes based on rule ID
    switch (ruleId) {
      case 'color-contrast':
        suggestions.push(
          '1. Increase the contrast ratio between the foreground and background colors.',
          '2. Use a color contrast analyzer to ensure a minimum ratio of 4.5:1 for normal text or 3:1 for large text.',
          '3. Consider using a darker foreground color or lighter background color.'
        );
        break;
        
      case 'aria-roles':
        suggestions.push(
          '1. Ensure the ARIA role is valid and properly used.',
          '2. Check the ARIA specification for the correct usage of this role.',
          '3. Consider using a semantic HTML element instead of ARIA roles when possible.'
        );
        break;
        
      case 'aria-required-attr':
        suggestions.push(
          '1. Add the required ARIA attributes for this role.',
          '2. Refer to the ARIA specification for the required attributes.'
        );
        break;
        
      case 'document-title':
        suggestions.push(
          '1. Add a descriptive title to the page.',
          '2. Ensure the title is unique and meaningful.',
          '3. Example: `<title>Page Name | Site Name</title>`'
        );
        break;
        
      case 'image-alt':
        suggestions.push(
          '1. Add an alt attribute to the image.',
          '2. Make the alt text descriptive of the image content and function.',
          '3. For decorative images, use alt="" (empty string).',
          '4. Example: `<img src="logo.png" alt="Company Logo">`'
        );
        break;
        
      case 'label':
        suggestions.push(
          '1. Associate a label with the form control.',
          '2. Use either `<label for="input-id">...</label>` with a matching id on the input.',
          '3. Or wrap the input with the label: `<label>Label text <input ...></label>`.',
          '4. For custom controls, use aria-label or aria-labelledby.'
        );
        break;
        
      default:
        suggestions.push(
          '1. Check the help documentation for this rule.',
          '2. Examine the HTML to identify accessibility issues.',
          '3. Consider using a more semantic HTML structure or appropriate ARIA attributes.'
        );
    }
    
    return suggestions;
  }
  
  /**
   * Create an HTML report for a route
   */
  private createRouteHtmlReport(routeDir: string, result: AuditResult, violations: Result[]): void {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>A11y Report - ${result.route}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
          h1, h2, h3 { color: #0066cc; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .summary { display: flex; gap: 20px; flex-wrap: wrap; }
          .summary-box { flex: 1; min-width: 200px; padding: 15px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .violation { margin-bottom: 30px; padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .violation-header { display: flex; justify-content: space-between; align-items: center; }
          .impact { display: inline-block; padding: 5px 10px; border-radius: 3px; color: white; font-weight: bold; }
          .impact.critical { background-color: #d9534f; }
          .impact.serious { background-color: #f0ad4e; }
          .impact.moderate { background-color: #5bc0de; }
          .impact.minor { background-color: #5cb85c; }
          .code { background-color: #f8f9fa; padding: 15px; border-radius: 3px; overflow-x: auto; font-family: monospace; }
          .screenshot { max-width: 100%; margin-top: 20px; border: 1px solid #ddd; }
          .tabs { display: flex; margin-bottom: 20px; }
          .tab { padding: 10px 15px; cursor: pointer; background-color: #f5f5f5; }
          .tab.active { background-color: #0066cc; color: white; }
          .tab-content { display: none; }
          .tab-content.active { display: block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Accessibility Report</h1>
            <p><strong>Route:</strong> ${result.route}</p>
            <p><strong>URL:</strong> ${result.url}</p>
            <p><strong>Timestamp:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <div class="summary-box">
              <h2>Violations</h2>
              <p><strong>Total:</strong> ${violations.length}</p>
              <p><strong>Critical:</strong> ${violations.filter(v => v.impact === 'critical').length}</p>
              <p><strong>Serious:</strong> ${violations.filter(v => v.impact === 'serious').length}</p>
              <p><strong>Moderate:</strong> ${violations.filter(v => v.impact === 'moderate').length}</p>
              <p><strong>Minor:</strong> ${violations.filter(v => v.impact === 'minor').length}</p>
            </div>
            
            <div class="summary-box">
              <h2>Passes</h2>
              <p><strong>Total:</strong> ${result.results.passes?.length || 0}</p>
            </div>
            
            <div class="summary-box">
              <h2>Incomplete</h2>
              <p><strong>Total:</strong> ${result.results.incomplete?.length || 0}</p>
            </div>
          </div>
          
          <div class="tabs">
            <div class="tab active" data-tab="violations">Violations</div>
            <div class="tab" data-tab="screenshot">Screenshot</div>
          </div>
          
          <div class="tab-content active" id="violations-tab">
            <h2>Violations (${violations.length})</h2>
            
            ${violations.length > 0 ? violations.map(violation => `
              <div class="violation">
                <div class="violation-header">
                  <h3>${violation.id}</h3>
                  <span class="impact ${violation.impact}">${violation.impact}</span>
                </div>
                
                <p><strong>Description:</strong> ${violation.description}</p>
                <p><strong>Help:</strong> ${violation.help}</p>
                <p><a href="${violation.helpUrl}" target="_blank">Documentation</a></p>
                
                <h4>Affected Elements (${violation.nodes.length})</h4>
                
                ${violation.nodes.map((node, index) => `
                  <div class="violation-instance">
                    <h5>Instance ${index + 1}</h5>
                    <div class="code">${this.escapeHtml(node.html)}</div>
                    <p><strong>Failure Summary:</strong></p>
                    <pre>${node.failureSummary}</pre>
                    
                    <h5>Suggested Fix:</h5>
                    <ul>
                      ${this.generateFixSuggestions(violation.id, node).map(suggestion => `
                        <li>${suggestion}</li>
                      `).join('')}
                    </ul>
                  </div>
                `).join('')}
              </div>
            `).join('') : '<p>No violations found!</p>'}
          </div>
          
          <div class="tab-content" id="screenshot-tab">
            <h2>Page Screenshot</h2>
            ${result.screenshot 
              ? `<img src="screenshot.png" alt="Page screenshot" class="screenshot">` 
              : `<p>No screenshot available</p>`
            }
          </div>
        </div>
        
        <script>
          document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
              document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
              
              tab.classList.add('active');
              document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
            });
          });
        </script>
      </body>
      </html>
    `;
    
    fs.writeFileSync(
      path.join(routeDir, 'report.html'),
      htmlContent
    );
  }
  
  /**
   * Create an HTML index for the full report
   */
  private createHtmlReportIndex(reportDir: string, violationData: ViolationData): void {
    const {
      totalViolations,
      routeViolations,
      impactCounts,
      mostCommonViolations,
    } = violationData;
    
    // Sort routes by violation count
    const sortedRoutes = Object.entries(routeViolations)
      .sort(([, countA], [, countB]) => countB - countA);
    
    // Get an array of impacts sorted by severity
    const impacts = ['critical', 'serious', 'moderate', 'minor'].filter(
      impact => impactCounts[impact] > 0
    );
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accessibility Audit Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
          h1, h2, h3 { color: #0066cc; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
          .summary { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 30px; }
          .summary-box { flex: 1; min-width: 200px; padding: 15px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .route-list { margin-bottom: 30px; }
          .route-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
          .route-item:hover { background-color: #f9f9f9; }
          .route-link { text-decoration: none; color: #0066cc; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; font-weight: bold; font-size: 0.8em; }
          .badge.critical { background-color: #d9534f; }
          .badge.serious { background-color: #f0ad4e; }
          .badge.moderate { background-color: #5bc0de; }
          .badge.minor { background-color: #5cb85c; }
          .badge.none { background-color: #5cb85c; }
          .chart { height: 200px; margin-bottom: 30px; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .bar-container { display: flex; height: 100%; align-items: flex-end; gap: 10px; }
          .bar { flex: 1; position: relative; min-width: 40px; }
          .bar.critical { background-color: #d9534f; }
          .bar.serious { background-color: #f0ad4e; }
          .bar.moderate { background-color: #5bc0de; }
          .bar.minor { background-color: #5cb85c; }
          .bar-label { position: absolute; top: -25px; left: 0; right: 0; text-align: center; font-weight: bold; }
          .bar-value { position: absolute; bottom: -25px; left: 0; right: 0; text-align: center; }
          .common-violations { margin-bottom: 30px; }
          .violation-item { padding: 15px; margin-bottom: 10px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .violation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .tabs { display: flex; margin-bottom: 20px; }
          .tab { padding: 10px 15px; cursor: pointer; background-color: #f5f5f5; }
          .tab.active { background-color: #0066cc; color: white; }
          .tab-content { display: none; }
          .tab-content.active { display: block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Accessibility Audit Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="tabs">
            <div class="tab active" data-tab="summary">Summary</div>
            <div class="tab" data-tab="routes">Routes</div>
            <div class="tab" data-tab="violations">Common Violations</div>
          </div>
          
          <div class="tab-content active" id="summary-tab">
            <h2>Summary</h2>
            
            <div class="summary">
              <div class="summary-box">
                <h3>Overview</h3>
                <p><strong>Routes tested:</strong> ${this.results.length}</p>
                <p><strong>Total violations:</strong> ${totalViolations}</p>
                <p><strong>Audit date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="summary-box">
                <h3>Impact Breakdown</h3>
                <p><strong>Critical:</strong> ${impactCounts.critical || 0}</p>
                <p><strong>Serious:</strong> ${impactCounts.serious || 0}</p>
                <p><strong>Moderate:</strong> ${impactCounts.moderate || 0}</p>
                <p><strong>Minor:</strong> ${impactCounts.minor || 0}</p>
              </div>
            </div>
            
            <div class="chart">
              <h3>Violations by Impact</h3>
              <div class="bar-container">
                ${impacts.map(impact => {
                  const count = impactCounts[impact] || 0;
                  const maxCount = Math.max(...Object.values(impactCounts));
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return `
                    <div class="bar ${impact}" style="height: ${height}%">
                      <div class="bar-label">${impact}</div>
                      <div class="bar-value">${count}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            
            <div class="chart">
              <h3>Top 5 Routes with Most Violations</h3>
              <div class="bar-container">
                ${sortedRoutes.slice(0, 5).map(([route, count]) => {
                  const maxCount = sortedRoutes[0][1];
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const routeName = route || 'Home';
                  
                  return `
                    <div class="bar ${count > 0 ? 'serious' : 'minor'}" style="height: ${height}%">
                      <div class="bar-label">${routeName.length > 10 ? routeName.substring(0, 8) + '...' : routeName}</div>
                      <div class="bar-value">${count}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
          
          <div class="tab-content" id="routes-tab">
            <h2>Routes</h2>
            
            <div class="route-list">
              ${sortedRoutes.map(([route, count]) => {
                const routeDirName = route.replace(/\//g, '_').replace(/^_/, '') || 'home';
                const routePath = `routes/${routeDirName}/report.html`;
                
                return `
                  <div class="route-item">
                    <a href="${routePath}" class="route-link">${route || 'Home'}</a>
                    <div>
                      ${count > 0 
                        ? `<span class="badge ${this.getImpactColorForRoute(route)}">
                             ${count} violation${count !== 1 ? 's' : ''}
                           </span>`
                        : `<span class="badge none">No violations</span>`
                      }
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <div class="tab-content" id="violations-tab">
            <h2>Most Common Violations</h2>
            
            <div class="common-violations">
              ${mostCommonViolations.map(violation => `
                <div class="violation-item">
                  <div class="violation-header">
                    <h3>${violation.id}</h3>
                    <span class="badge ${violation.impact}">${violation.impact}</span>
                  </div>
                  
                  <p><strong>Description:</strong> ${violation.description}</p>
                  <p><strong>Occurrences:</strong> ${violation.count}</p>
                  
                  <h4>Common fixes:</h4>
                  <ul>
                    ${this.generateFixSuggestions(violation.id, { html: '', failureSummary: '' }).map(suggestion => `
                      <li>${suggestion}</li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <script>
          document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
              document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
              
              tab.classList.add('active');
              document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
            });
          });
        </script>
      </body>
      </html>
    `;
    
    fs.writeFileSync(
      path.join(reportDir, 'index.html'),
      htmlContent
    );
  }
  
  /**
   * Helper method to get impact color for a route based on its worst violation
   */
  private getImpactColorForRoute(route: string): string {
    const result = this.results.find(r => r.route === route);
    
    if (!result || !result.results.violations || result.results.violations.length === 0) {
      return 'none';
    }
    
    const impacts = result.results.violations.map(v => v.impact);
    
    if (impacts.includes('critical')) return 'critical';
    if (impacts.includes('serious')) return 'serious';
    if (impacts.includes('moderate')) return 'moderate';
    return 'minor';
  }
  
  /**
   * Helper method to escape HTML for display
   */
  private escapeHtml(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Configure audit options
   * @param options - New options to merge with existing ones
   */
  public configure(options: Partial<AuditOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }
  
  /**
   * Get audit results
   */
  public getResults(): AuditResult[] {
    return this.results;
  }
  
  /**
   * Check if a URL passes all accessibility checks
   * @param url - URL to check
   */
  public async checkSingleUrl(url: string): Promise<{
    passes: boolean;
    violations: number;
    results: AxeResults;
  }> {
    console.log(chalk.blue(`Checking accessibility for URL: ${url}`));
    
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await this.browser.newPage();
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Wait for content to load if selector provided
      if (this.options.waitForSelector) {
        await page.waitForSelector(this.options.waitForSelector, { 
          timeout: this.options.waitTimeout 
        });
      } else {
        await page.waitForTimeout(1000); // Default wait time
      }
      
      // Run axe analysis
      const results = await this.runAxeAnalysis(page);
      
      // Log violations summary
      this.logViolationsSummary(url, results);
      
      await page.close();
      
      return {
        passes: results.violations?.length === 0,
        violations: results.violations?.length || 0,
        results,
      };
      
    } catch (error) {
      console.error(chalk.red(`Error checking URL ${url}:`), error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
  
  /**
   * Compare two audit runs and generate a diff report
   * @param oldReportDir - Directory containing the old report
   * @param newReportDir - Directory containing the new report
   * @param outputDir - Directory to save the diff report
   */
  public static async generateDiffReport(
    oldReportDir: string,
    newReportDir: string,
    outputDir: string
  ): Promise<void> {
    console.log(chalk.blue('Generating diff report...'));
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      // Load raw results from both reports
      const oldResultsPath = path.join(oldReportDir, 'raw-results.json');
      const newResultsPath = path.join(newReportDir, 'raw-results.json');
      
      if (!fs.existsSync(oldResultsPath) || !fs.existsSync(newResultsPath)) {
        throw new Error('Could not find raw results files in one or both report directories');
      }
      
      const oldResults: AuditResult[] = JSON.parse(fs.readFileSync(oldResultsPath, 'utf8'));
      const newResults: AuditResult[] = JSON.parse(fs.readFileSync(newResultsPath, 'utf8'));
      
      // Generate diff data
      const diffData = {
        timestamp: new Date().toISOString(),
        routes: {} as Record<string, {
          old: number;
          new: number;
          diff: number;
          added: string[];
          fixed: string[];
        }>,
        summary: {
          oldTotal: 0,
          newTotal: 0,
          diff: 0,
          fixed: 0,
          added: 0,
        },
      };
      
      // Process each route in new results
      newResults.forEach(newResult => {
        const route = newResult.route;
        const oldResult = oldResults.find(r => r.route === route);
        
        const newViolations = newResult.results.violations || [];
        const oldViolations = oldResult?.results.violations || [];
        
        const newViolationIds = new Set(newViolations.map(v => v.id));
        const oldViolationIds = new Set(oldViolations.map(v => v.id));
        
        const addedViolations = [...newViolationIds].filter(id => !oldViolationIds.has(id));
        const fixedViolations = [...oldViolationIds].filter(id => !newViolationIds.has(id));
        
        diffData.routes[route] = {
          old: oldViolations.length,
          new: newViolations.length,
          diff: newViolations.length - oldViolations.length,
          added: addedViolations,
          fixed: fixedViolations,
        };
        
        diffData.summary.oldTotal += oldViolations.length;
        diffData.summary.newTotal += newViolations.length;
        diffData.summary.fixed += fixedViolations.length;
        diffData.summary.added += addedViolations.length;
      });
      
      diffData.summary.diff = diffData.summary.newTotal - diffData.summary.oldTotal;
      
      // Save diff data
      fs.writeFileSync(
        path.join(outputDir, 'diff-data.json'),
        JSON.stringify(diffData, null, 2)
      );
      
      // Generate diff report HTML
      const diffHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Accessibility Audit Diff Report</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
            h1, h2, h3 { color: #0066cc; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
            .summary { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 30px; }
            .summary-box { flex: 1; min-width: 200px; padding: 15px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .route-list { margin-bottom: 30px; }
            .route-item { padding: 15px; margin-bottom: 10px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .diff-positive { color: #d9534f; }
            .diff-negative { color: #5cb85c; }
            .diff-neutral { color: #5bc0de; }
            .violations-list { margin-top: 10px; }
            .violations-list h4 { margin-bottom: 5px; }
            .violations-list ul { margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Accessibility Audit Diff Report</h1>
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="summary">
              <div class="summary-box">
                <h3>Overview</h3>
                <p><strong>Routes analyzed:</strong> ${Object.keys(diffData.routes).length}</p>
                <p>
                  <strong>Total violations:</strong> 
                  ${diffData.summary.oldTotal} → ${diffData.summary.newTotal}
                  (${diffData.summary.diff >= 0 ? '+' : ''}${diffData.summary.diff})
                </p>
              </div>
              
              <div class="summary-box">
                <h3>Changes</h3>
                <p><strong>Fixed violations:</strong> ${diffData.summary.fixed}</p>
                <p><strong>New violations:</strong> ${diffData.summary.added}</p>
                <p>
                  <strong>Overall change:</strong> 
                  <span class="$ {
                    diffData.summary.diff > 0 ? 'diff-positive' : 
                    diffData.summary.diff < 0 ? 'diff-negative' : 'diff-neutral'
                  }">
                    ${diffData.summary.diff >= 0 ? '+' : ''}${diffData.summary.diff}
                  </span>
                </p>
              </div>
            </div>
            
            <h2>Changes by Route</h2>
            
            <div class="route-list">
              ${Object.entries(diffData.routes)
                .sort(([, a], [, b]) => b.diff - a.diff)
                .map(([route, data]) => `
                  <div class="route-item">
                    <h3>${route || 'Home'}</h3>
                    <p>
                      <strong>Violations:</strong> 
                      ${data.old} → ${data.new}
                      (
                        <span class="$ {
                          data.diff > 0 ? 'diff-positive' : 
                          data.diff < 0 ? 'diff-negative' : 'diff-neutral'
                        }">
                          ${data.diff >= 0 ? '+' : ''}${data.diff}
                        </span>
                      )
                    </p>
                    
                    <div class="violations-list">
                      ${data.fixed.length > 0 ? `
                        <h4>Fixed violations (${data.fixed.length}):</h4>
                        <ul>
                          ${data.fixed.map(id => `<li>${id}</li>`).join('')}
                        </ul>
                      ` : ''}
                      
                      ${data.added.length > 0 ? `
                        <h4>New violations (${data.added.length}):</h4>
                        <ul>
                          ${data.added.map(id => `<li>${id}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  </div>
              `).join('')}
            </div>
          </div>
        </body>
        </html>
      `;
      
      fs.writeFileSync(
        path.join(outputDir, 'diff-report.html'),
        diffHtml
      );
      
      console.log(chalk.green(`Diff report generated in ${outputDir}`));
      
    } catch (error) {
      console.error(chalk.red('Error generating diff report:'), error);
      throw error;
    }
  }
  
  /**
   * Export the audit results to CSV format
   * @param outputPath - Path to save the CSV file
   */
  public exportToCsv(outputPath: string): void {
    console.log(chalk.blue('Exporting results to CSV...'));
    
    try {
      // Prepare CSV headers
      const headers = [
        'Route',
        'URL',
        'Timestamp',
        'Total Violations',
        'Critical',
        'Serious',
        'Moderate',
        'Minor',
        'Violation IDs'
      ];
      
      // Prepare CSV rows
      const rows = this.results.map(result => {
        const violations = result.results.violations || [];
        
        const criticalCount = violations.filter(v => v.impact === 'critical').length;
        const seriousCount = violations.filter(v => v.impact === 'serious').length;
        const moderateCount = violations.filter(v => v.impact === 'moderate').length;
        const minorCount = violations.filter(v => v.impact === 'minor').length;
        
        const violationIds = violations.map(v => v.id).join(', ');
        
        return [
          result.route,
          result.url,
          result.timestamp,
          violations.length.toString(),
          criticalCount.toString(),
          seriousCount.toString(),
          moderateCount.toString(),
          minorCount.toString(),
          violationIds
        ];
      });
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      // Write to file
      fs.writeFileSync(outputPath, csvContent);
      
      console.log(chalk.green(`CSV exported to ${outputPath}`));
      
    } catch (error) {
      console.error(chalk.red('Error exporting to CSV:'), error);
      throw error;
    }
  }
  
  /**
   * Generate a PDF report of the audit results
   * @param outputPath - Path to save the PDF file
   */
  public async exportToPdf(outputPath: string): Promise<void> {
    console.log(chalk.blue('Exporting results to PDF...'));
    
    try {
      // Generate a temporary HTML report
      const tempDir = path.join(this.options.outputDir, `temp-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Generate report
      const violationData = this.analyzeViolations();
      this.createHtmlReportIndex(tempDir, violationData);
      
      // Launch browser for PDF generation
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      
      // Navigate to the HTML report
      await page.goto(`file://${path.join(tempDir, 'index.html')}`, {
        waitUntil: 'networkidle2',
      });
      
      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });
      
      await browser.close();
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      console.log(chalk.green(`PDF exported to ${outputPath}`));
      
    } catch (error) {
      console.error(chalk.red('Error exporting to PDF:'), error);
      throw error;
    }
  }
  
  /**
   * Get a list of best practices recommendations based on found violations
   */
  public getBestPractices(): string[] {
    console.log(chalk.blue('Generating best practices recommendations...'));
    
    const violationData = this.analyzeViolations();
    const { mostCommonViolations } = violationData;
    
    const bestPractices: string[] = [
      '# Accessibility Best Practices',
      '',
      'Based on the audit results, here are recommended best practices to address the most common issues:',
      '',
    ];
    
    // General recommendations
    bestPractices.push(
      '## General Recommendations',
      '',
      '1. **Regular Testing**: Integrate accessibility testing into your development process.',
      '2. **Use Semantic HTML**: Choose appropriate HTML elements that express their meaning.',
      '3. **Keyboard Accessibility**: Ensure all interactive elements are accessible via keyboard.',
      '4. **Focus Management**: Maintain visible focus indicators and logical focus order.',
      '5. **Text Alternatives**: Provide alt text for images and descriptions for complex elements.',
      '',
    );
    
    // Specific recommendations based on violations
    if (mostCommonViolations.length > 0) {
      bestPractices.push(
        '## Specific Recommendations',
        '',
      );
      
      mostCommonViolations.forEach(violation => {
        let recommendation = '';
        
        switch (violation.id) {
          case 'color-contrast':
            recommendation = 'Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text) between text and background colors.';
            break;
            
          case 'image-alt':
            recommendation = 'Add descriptive alt text to all images. Use empty alt attributes (alt="") for decorative images.';
            break;
            
          case 'label':
            recommendation = 'Associate labels with form controls using the for/id attributes or by nesting inputs inside label elements.';
            break;
            
          case 'document-title':
            recommendation = 'Provide a descriptive page title that identifies the content of the page.';
            break;
            
          case 'aria-roles':
            recommendation = 'Use ARIA roles correctly according to the ARIA specification. Consider using semantic HTML elements instead when possible.';
            break;
            
          case 'aria-required-attr':
            recommendation = 'Include all required attributes for ARIA roles to function properly.';
            break;
            
          case 'heading-order':
            recommendation = 'Maintain a logical heading structure with no skipped levels (e.g., h1 to h3 without h2).';
            break;
            
          case 'link-name':
            recommendation = 'Ensure links have discernible text that clearly indicates their purpose.';
            break;
            
          case 'button-name':
            recommendation = 'Provide text content or aria-label for buttons that describes their function.';
            break;
            
          default:
            recommendation = `Address ${violation.id} violations by following the WCAG guidelines and specific remediation suggestions in the detailed report.`;
        }
        
        bestPractices.push(`- **${violation.id}**: ${recommendation}`);
      });
    }
    
    // Add implementation strategies
    bestPractices.push(
      '',
      '## Implementation Strategies',
      '',
      '1. **Prioritize by Impact**: Focus first on fixing critical and serious issues that affect core functionality.',
      '2. **Educate Development Team**: Share these best practices and specific issues with all developers.',
      '3. **Create Accessible Components**: Build a library of pre-tested accessible UI components.',
      '4. **Test with Assistive Technology**: Validate fixes using screen readers and other assistive technologies.',
      '5. **Include Users with Disabilities**: Incorporate feedback from users with various disabilities when possible.',
      '',
      'For more detailed guidance, refer to the [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/).',
    );
    
    return bestPractices;
  }
} 