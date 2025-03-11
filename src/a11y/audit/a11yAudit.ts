import { axe, RunOptions, ElementContext, ImpactValue } from 'axe-core';

/**
 * Interface for audit results
 */
export interface A11yAuditResult {
  violations: A11yViolation[];
  passes: A11yPass[];
  incomplete: A11yIncomplete[];
  inapplicable: A11yInapplicable[];
  timestamp: Date;
  url: string;
  component?: string;
}

/**
 * Interface for a violation
 */
export interface A11yViolation {
  id: string;
  impact: ImpactValue;
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yNode[];
  tags: string[];
}

/**
 * Interface for a pass
 */
export interface A11yPass {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yNode[];
  tags: string[];
}

/**
 * Interface for an incomplete result
 */
export interface A11yIncomplete {
  id: string;
  impact: ImpactValue;
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yNode[];
  tags: string[];
}

/**
 * Interface for an inapplicable rule
 */
export interface A11yInapplicable {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yNode[];
  tags: string[];
}

/**
 * Interface for a node in the results
 */
export interface A11yNode {
  html: string;
  target: string[];
  failureSummary?: string;
}

/**
 * Configuration options for the audit
 */
export interface A11yAuditOptions {
  rules?: {
    [key: string]: {
      enabled: boolean;
    };
  };
  reporter?: 'v1' | 'v2' | 'raw' | 'no-passes';
  resultTypes?: ('violations' | 'incomplete' | 'inapplicable' | 'passes')[];
  selectors?: boolean;
  xpath?: boolean;
  absolutePaths?: boolean;
  ancestry?: boolean;
  includedImpacts?: ImpactValue[];
  excludeHidden?: boolean;
}

/**
 * Default audit options
 */
const defaultAuditOptions: A11yAuditOptions = {
  reporter: 'v2',
  resultTypes: ['violations', 'incomplete'],
  selectors: true,
  xpath: false,
  absolutePaths: false,
  ancestry: true,
  includedImpacts: ['critical', 'serious', 'moderate', 'minor'],
  excludeHidden: false,
};

/**
 * Runs an accessibility audit on the provided element or context
 * 
 * @param context - The element or context to audit
 * @param options - Options for the audit
 * @returns - The audit results
 */
export const runA11yAudit = async (
  context: ElementContext = document,
  options: A11yAuditOptions = {}
): Promise<A11yAuditResult> => {
  // Merge options with defaults
  const mergedOptions: RunOptions = {
    ...defaultAuditOptions,
    ...options,
  };
  
  try {
    // Run the axe audit
    const results = await axe.run(context, mergedOptions as any);
    
    // Format the results
    const auditResult: A11yAuditResult = {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
      timestamp: new Date(),
      url: window.location.href,
    };
    
    return auditResult;
  } catch (error) {
    console.error('A11y audit failed:', error);
    throw error;
  }
};

/**
 * Runs an accessibility audit on a specific component
 * 
 * @param componentRef - Reference to the component to audit
 * @param componentName - Name of the component
 * @param options - Options for the audit
 * @returns - The audit results
 */
export const runComponentAudit = async (
  componentRef: React.RefObject<HTMLElement>,
  componentName: string,
  options: A11yAuditOptions = {}
): Promise<A11yAuditResult> => {
  if (!componentRef.current) {
    throw new Error(`Component "${componentName}" not found in DOM`);
  }
  
  const results = await runA11yAudit(componentRef.current, options);
  
  // Add component name to the results
  return {
    ...results,
    component: componentName,
  };
};

/**
 * Generates a summary of audit violations
 * 
 * @param auditResult - The audit results
 * @returns - A summary of the violations
 */
export const generateViolationSummary = (auditResult: A11yAuditResult): string => {
  if (auditResult.violations.length === 0) {
    return 'No accessibility violations found.';
  }
  
  // Count violations by impact
  const countByImpact = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };
  
  auditResult.violations.forEach((violation) => {
    countByImpact[violation.impact]++;
  });
  
  // Generate summary
  let summary = `Found ${auditResult.violations.length} accessibility violations:\n`;
  summary += `- Critical: ${countByImpact.critical}\n`;
  summary += `- Serious: ${countByImpact.serious}\n`;
  summary += `- Moderate: ${countByImpact.moderate}\n`;
  summary += `- Minor: ${countByImpact.minor}\n\n`;
  
  // Add details for critical and serious violations
  const importantViolations = auditResult.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  
  if (importantViolations.length > 0) {
    summary += 'Important violations:\n';
    
    importantViolations.forEach((violation) => {
      summary += `- [${violation.impact.toUpperCase()}] ${violation.help} (${violation.id})\n`;
      summary += `  Help: ${violation.helpUrl}\n`;
      
      // Add affected elements
      if (violation.nodes.length > 0) {
        summary += '  Affected elements:\n';
        violation.nodes.slice(0, 3).forEach((node) => {
          summary += `  - ${node.html.substring(0, 100)}${node.html.length > 100 ? '...' : ''}\n`;
        });
        
        if (violation.nodes.length > 3) {
          summary += `  - ... and ${violation.nodes.length - 3} more\n`;
        }
      }
      
      summary += '\n';
    });
  }
  
  return summary;
};

/**
 * Checks if a component passes accessibility audit
 * 
 * @param componentRef - Reference to the component to audit
 * @param componentName - Name of the component
 * @param options - Options for the audit
 * @returns - True if the component has no violations, false otherwise
 */
export const isComponentAccessible = async (
  componentRef: React.RefObject<HTMLElement>,
  componentName: string,
  options: A11yAuditOptions = {}
): Promise<boolean> => {
  try {
    const results = await runComponentAudit(componentRef, componentName, options);
    return results.violations.length === 0;
  } catch (error) {
    console.error(`Error checking accessibility for ${componentName}:`, error);
    return false;
  }
};

/**
 * Export default functions for easier imports
 */
export default {
  runA11yAudit,
  runComponentAudit,
  generateViolationSummary,
  isComponentAccessible,
}; 