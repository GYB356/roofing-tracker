// src/a11y/audit/components/A11yAuditBadge.tsx
import React, { useState } from 'react';
import { A11yAuditResult } from '../a11yAudit';

interface A11yAuditBadgeProps {
  results: A11yAuditResult | null;
  isAuditing?: boolean;
  showDetails?: boolean;
  onRunAudit?: () => void;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * A11y Audit Badge component
 * Displays a badge with audit status and violations count
 */
const A11yAuditBadge: React.FC<A11yAuditBadgeProps> = ({
  results,
  isAuditing = false,
  showDetails = false, 
  onRunAudit,
  className = '',
  position = 'bottom-right',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get the count of violations by impact
  const getViolationCounts = () => {
    if (!results) return { total: 0, critical: 0, serious: 0 };
    
    const critical = results.violations.filter(v => v.impact === 'critical').length;
    const serious = results.violations.filter(v => v.impact === 'serious').length;
    
    return {
      total: results.violations.length,
      critical,
      serious,
    };
  };
  
  const { total, critical, serious } = getViolationCounts();
  
  // Determine badge status and color
  const getBadgeStatus = () => {
    if (isAuditing) return 'auditing';
    if (!results) return 'unknown';
    if (total === 0) return 'passed';
    if (critical > 0) return 'critical';
    if (serious > 0) return 'serious';
    return 'warning';
  };
  
  const status = getBadgeStatus();
  
  // Get badge title based on status
  const getBadgeTitle = () => {
    switch (status) {
      case 'auditing':
        return 'Running accessibility audit...';
      case 'unknown':
        return 'Accessibility audit not run';
      case 'passed':
        return 'Accessibility audit passed';
      case 'critical':
        return `${total} accessibility violations (${critical} critical)`;
      case 'serious':
        return `${total} accessibility violations (${serious} serious)`;
      case 'warning':
        return `${total} accessibility violations`;
      default:
        return 'Accessibility status';
    }
  };
  
  // Get badge label
  const getBadgeLabel = () => {
    switch (status) {
      case 'auditing':
        return 'Auditing...';
      case 'unknown':
        return 'Not Audited';
      case 'passed':
        return 'Passed';
      case 'critical':
      case 'serious':
      case 'warning':
        return total;
      default:
        return '?';
    }
  };
  
  // Handle badge click
  const handleClick = () => {
    if (isAuditing) return;
    if (showDetails) {
      setIsExpanded(!isExpanded);
    } else if (onRunAudit) {
      onRunAudit();
    }
  };
  
  // Handle run audit button click
  const handleRunAudit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRunAudit) {
      onRunAudit();
    }
  };
  
  return (
    <div 
      className={`a11y-audit-badge-container a11y-audit-badge-${position} ${className}`}
    >
      {/* Details panel (when expanded) */}
      {isExpanded && showDetails && (
        <div className="a11y-audit-badge-details">
          <div className="a11y-audit-badge-details-header">
            <h4>Accessibility Audit Results</h4>
            <button
              className="a11y-audit-badge-close"
              onClick={() => setIsExpanded(false)}
              aria-label="Close audit details"
            >
              ×
            </button>
          </div>
          
          <div className="a11y-audit-badge-details-content">
            {!results ? (
              <p>No audit results available.</p>
            ) : (
              <>
                <div className="a11y-audit-badge-summary">
                  <div className="a11y-audit-badge-stat">
                    <span className="a11y-audit-badge-stat-label">Total</span>
                    <span className="a11y-audit-badge-stat-value">{total}</span>
                  </div>
                  <div className="a11y-audit-badge-stat a11y-audit-badge-stat-critical">
                    <span className="a11y-audit-badge-stat-label">Critical</span>
                    <span className="a11y-audit-badge-stat-value">{critical}</span>
                  </div>
                  <div className="a11y-audit-badge-stat a11y-audit-badge-stat-serious">
                    <span className="a11y-audit-badge-stat-label">Serious</span>
                    <span className="a11y-audit-badge-stat-value">{serious}</span>
                  </div>
                </div>
                
                {total > 0 ? (
                  <div className="a11y-audit-badge-violations">
                    <h5>Violations</h5>
                    <ul className="a11y-audit-badge-violations-list">
                      {results.violations.map((violation) => (
                        <li 
                          key={violation.id} 
                          className={`a11y-audit-badge-violation a11y-audit-badge-violation-${violation.impact}`}
                        >
                          <div className="a11y-audit-badge-violation-header">
                            <span className="a11y-audit-badge-violation-title">
                              {violation.help}
                            </span>
                            <span className="a11y-audit-badge-violation-impact">
                              {violation.impact}
                            </span>
                          </div>
                          <p className="a11y-audit-badge-violation-description">
                            {violation.description}
                          </p>
                          <a
                            href={violation.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="a11y-audit-badge-violation-link"
                          >
                            Learn More
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="a11y-audit-badge-passed-message">
                    All accessibility checks passed! 🎉
                  </p>
                )}
              </>
            )}
          </div>
          
          <div className="a11y-audit-badge-details-footer">
            {onRunAudit && (
              <button
                className="a11y-audit-badge-button"
                onClick={handleRunAudit}
                disabled={isAuditing}
              >
                {isAuditing ? 'Auditing...' : 'Run Audit'}
              </button>
            )}
            <button
              className="a11y-audit-badge-button a11y-audit-badge-button-secondary"
              onClick={() => setIsExpanded(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Badge */}
      <button
        className={`a11y-audit-badge a11y-audit-badge-${status}`}
        onClick={handleClick}
        disabled={isAuditing}
        aria-label={getBadgeTitle()}
        title={getBadgeTitle()}
        aria-expanded={isExpanded}
      >
        <span className="a11y-audit-badge-icon">
          {status === 'passed' && '✓'}
          {(status === 'critical' || status === 'serious' || status === 'warning') && '!'}
          {status === 'unknown' && '?'}
          {status === 'auditing' && '⟳'}
        </span>
        <span className="a11y-audit-badge-label">
          {getBadgeLabel()}
        </span>
      </button>
    </div>
  );
};

export default A11yAuditBadge;