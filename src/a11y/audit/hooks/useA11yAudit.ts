import { useRef, useEffect, useState, useCallback } from 'react';
import { a11yAuditService } from '../a11yAuditService';
import { A11yAuditResult } from '../a11yAudit';
import { useA11y } from '../../hooks/useA11y';

/**
 * Options for the useA11yAudit hook
 */
export interface UseA11yAuditOptions {
  // Whether to run the audit automatically on mount
  runOnMount?: boolean;
  
  // Whether to run the audit automatically when the component updates
  runOnUpdate?: boolean;
  
  // Whether to announce audit results to screen readers
  announceResults?: boolean;
  
  // Specify a component name for the audit (default: auto-generated)
  componentName?: string;
  
  // Callback when audit completes
  onAuditComplete?: (results: A11yAuditResult) => void;
  
  // Callback when audit fails
  onAuditError?: (error: any) => void;
}

/**
 * Hook to run accessibility audits on components
 * 
 * @param options - Configuration options for the audit
 * @returns - Audit utilities and state
 */
export const useA11yAudit = (options: UseA11yAuditOptions = {}) => {
  const {
    runOnMount = false,
    runOnUpdate = false,
    announceResults = true,
    componentName,
    onAuditComplete,
    onAuditError,
  } = options;
  
  // Component reference
  const componentRef = useRef<HTMLElement>(null);
  
  // Audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastResult, setLastResult] = useState<A11yAuditResult | null>(null);
  const [error, setError] = useState<any>(null);
  
  // Generate a component name if not provided
  const generatedName = useRef<string>(`component-${Math.random().toString(36).substring(2, 9)}`);
  const name = componentName || generatedName.current;
  
  // Get a11y utilities
  const { announce } = useA11y();
  
  // Run the audit
  const runAudit = useCallback(async (): Promise<A11yAuditResult | null> => {
    if (!componentRef.current) {
      return null;
    }
    
    setIsAuditing(true);
    setError(null);
    
    try {
      const results = await a11yAuditService.runComponentAudit(componentRef, name);
      
      setLastResult(results);
      
      // Announce results if enabled
      if (announceResults) {
        const violationCount = results.violations.length;
        if (violationCount === 0) {
          announce(`Accessibility audit passed with no violations`, false);
        } else {
          const criticalCount = results.violations.filter(v => v.impact === 'critical').length;
          const seriousCount = results.violations.filter(v => v.impact === 'serious').length;
          
          announce(
            `Accessibility audit found ${violationCount} violations. ` +
            `${criticalCount} critical, ${seriousCount} serious.`,
            criticalCount > 0
          );
        }
      }
      
      // Call onAuditComplete callback if provided
      if (onAuditComplete) {
        onAuditComplete(results);
      }
      
      return results;
    } catch (err) {
      setError(err);
      
      // Announce error if enabled
      if (announceResults) {
        announce(`Accessibility audit failed: ${err}`, true);
      }
      
      // Call onAuditError callback if provided
      if (onAuditError) {
        onAuditError(err);
      }
      
      return null;
    } finally {
      setIsAuditing(false);
    }
  }, [name, announce, announceResults, onAuditComplete, onAuditError]);
  
  // Run audit on mount if enabled
  useEffect(() => {
    if (runOnMount) {
      runAudit();
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Run audit on update if enabled
  useEffect(() => {
    if (runOnUpdate && !runOnMount) {
      // Skip the first run (mount)
      const isFirstRun = useRef(true);
      
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }
      
      runAudit();
    }
  }, [runOnUpdate, runOnMount, runAudit]);
  
  // Get violations from the last result
  const getViolations = useCallback(() => {
    return lastResult?.violations || [];
  }, [lastResult]);
  
  // Check if the component has any violations
  const hasViolations = useCallback(() => {
    return (lastResult?.violations.length || 0) > 0;
  }, [lastResult]);
  
  // Check if the component has any critical violations
  const hasCriticalViolations = useCallback(() => {
    return (lastResult?.violations.filter(v => v.impact === 'critical').length || 0) > 0;
  }, [lastResult]);
  
  // Format audit results as a human-readable summary
  const formatResults = useCallback(() => {
    if (!lastResult) return 'No audit results available';
    
    let summary = '';
    
    const violations = lastResult.violations.length;
    const passes = lastResult.passes.length;
    const incomplete = lastResult.incomplete.length;
    
    if (violations === 0) {
      summary = `✅ Component passed accessibility audit with ${passes} passes`;
      
      if (incomplete > 0) {
        summary += ` and ${incomplete} incomplete checks`;
      }
      
      return summary;
    }
    
    const critical = lastResult.violations.filter(v => v.impact === 'critical').length;
    const serious = lastResult.violations.filter(v => v.impact === 'serious').length;
    const moderate = lastResult.violations.filter(v => v.impact === 'moderate').length;
    const minor = lastResult.violations.filter(v => v.impact === 'minor').length;
    
    summary = `❌ Component has ${violations} accessibility violations: `;
    
    const parts = [];
    if (critical > 0) parts.push(`${critical} critical`);
    if (serious > 0) parts.push(`${serious} serious`);
    if (moderate > 0) parts.push(`${moderate} moderate`);
    if (minor > 0) parts.push(`${minor} minor`);
    
    summary += parts.join(', ');
    
    return summary;
  }, [lastResult]);
  
  // Return audit utilities and state
  return {
    // Refs
    componentRef,
    
    // State
    isAuditing,
    lastResult,
    error,
    
    // Methods
    runAudit,
    getViolations,
    hasViolations,
    hasCriticalViolations,
    formatResults,
  };
};

export default useA11yAudit; 