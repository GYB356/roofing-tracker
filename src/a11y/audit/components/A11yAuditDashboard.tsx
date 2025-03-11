// src/a11y/audit/components/A11yAuditDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { a11yAuditService, A11yAuditHistoryEntry, A11yAuditRule } from '../a11yAuditService';
import { A11yViolation, A11yAuditResult, generateViolationSummary } from '../a11yAudit';
import { useA11y } from '../../hooks/useA11y';

interface AuditDashboardProps {
  className?: string;
  showControls?: boolean;
  showRuleManagement?: boolean;
  onRequestAudit?: () => void;
}

/**
 * A11y Audit Dashboard component
 * Displays accessibility audit results and provides controls for managing audits
 */
const A11yAuditDashboard: React.FC<AuditDashboardProps> = ({
  className = '',
  showControls = true,
  showRuleManagement = true,
  onRequestAudit,
}) => {
  // State for audit history
  const [auditHistory, setAuditHistory] = useState<A11yAuditHistoryEntry[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [autoAuditEnabled, setAutoAuditEnabled] = useState(false);
  const [auditInterval, setAuditInterval] = useState(60); // minutes
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  
  // State for rules management
  const [auditRules, setAuditRules] = useState<A11yAuditRule[]>([]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<A11yAuditRule>>({
    id: '',
    description: '',
    enabled: true,
    severity: 'moderate',
    tags: [],
  });
  
  // Get a11y utilities
  const { announce } = useA11y();
  
  // Load audit history and configuration on mount
  useEffect(() => {
    // Load audit history
    setAuditHistory(a11yAuditService.getAuditHistory());
    
    // Load audit rules
    setAuditRules(a11yAuditService.getAuditRules());
    
    // Check if auto audit is enabled
    setAutoAuditEnabled(a11yAuditService['autoAuditEnabled'] || false);
    
    // Get audit interval
    setAuditInterval((a11yAuditService['auditInterval'] || 3600000) / 60000);
    
    // Get webhook URL
    setWebhookUrl(a11yAuditService['webhookUrl'] || '');
    
    // Set the first audit as selected if any exist
    if (a11yAuditService.getAuditHistory().length > 0) {
      setSelectedAuditId(a11yAuditService.getAuditHistory()[0].id);
    }
  }, []);
  
  // Get the selected audit details
  const selectedAudit = useMemo(() => {
    if (!selectedAuditId) return null;
    return auditHistory.find(audit => audit.id === selectedAuditId) || null;
  }, [selectedAuditId, auditHistory]);
  
  // Request a new audit
  const handleRequestAudit = async () => {
    try {
      announce('Running accessibility audit...', true);
      
      if (onRequestAudit) {
        onRequestAudit();
      } else {
        await a11yAuditService.runPageAudit();
      }
      
      // Update the history
      setAuditHistory(a11yAuditService.getAuditHistory());
      
      // Select the latest audit
      if (a11yAuditService.getAuditHistory().length > 0) {
        setSelectedAuditId(a11yAuditService.getAuditHistory()[0].id);
      }
      
      announce('Accessibility audit completed', true);
    } catch (error) {
      console.error('Failed to run accessibility audit:', error);
      announce('Failed to run accessibility audit', true);
    }
  };
  
  // Toggle auto audit
  const handleToggleAutoAudit = () => {
    if (autoAuditEnabled) {
      a11yAuditService.stopAutoAudit();
      setAutoAuditEnabled(false);
      announce('Automatic accessibility audits disabled', false);
    } else {
      a11yAuditService.startAutoAudit(auditInterval * 60000);
      setAutoAuditEnabled(true);
      announce(`Automatic accessibility audits enabled, running every ${auditInterval} minutes`, false);
    }
  };
  
  // Update audit interval
  const handleAuditIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value, 10);
    setAuditInterval(interval);
    
    if (autoAuditEnabled) {
      a11yAuditService.stopAutoAudit();
      a11yAuditService.startAutoAudit(interval * 60000);
      announce(`Audit interval updated to ${interval} minutes`, false);
    }
  };
  
  // Update webhook URL
  const handleWebhookUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebhookUrl(e.target.value);
  };
  
  // Save webhook URL
  const handleSaveWebhookUrl = () => {
    a11yAuditService.setWebhookUrl(webhookUrl || null);
    announce('Webhook URL updated', false);
  };
  
  // Clear audit history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all audit history?')) {
      a11yAuditService.clearAuditHistory();
      setAuditHistory([]);
      setSelectedAuditId(null);
      announce('Audit history cleared', true);
    }
  };
  
  // Update audit rule
  const handleUpdateRule = (ruleId: string, updates: Partial<Omit<A11yAuditRule, 'id'>>) => {
    a11yAuditService.updateAuditRule(ruleId, updates);
    setAuditRules(a11yAuditService.getAuditRules());
    announce(`Rule ${ruleId} updated`, false);
  };
  
  // Add new rule
  const handleAddRule = () => {
    if (!newRule.id || !newRule.description) {
      announce('Rule ID and description are required', true);
      return;
    }
    
    const rule: A11yAuditRule = {
      id: newRule.id,
      description: newRule.description || '',
      enabled: newRule.enabled || true,
      severity: newRule.severity as any || 'moderate',
      tags: newRule.tags || [],
    };
    
    a11yAuditService.addAuditRule(rule);
    setAuditRules(a11yAuditService.getAuditRules());
    
    // Reset form
    setNewRule({
      id: '',
      description: '',
      enabled: true,
      severity: 'moderate',
      tags: [],
    });
    
    setIsAddingRule(false);
    announce(`Rule ${rule.id} added`, false);
  };
  
  // Remove rule
  const handleRemoveRule = (ruleId: string) => {
    if (window.confirm(`Are you sure you want to remove the rule "${ruleId}"?`)) {
      a11yAuditService.removeAuditRule(ruleId);
      setAuditRules(a11yAuditService.getAuditRules());
      announce(`Rule ${ruleId} removed`, false);
    }
  };
  
  return (
    <div className={`a11y-audit-dashboard ${className}`}>
      <h2 className="a11y-audit-dashboard-title">Accessibility Audit Dashboard</h2>
      
      {/* Audit Controls */}
      {showControls && (
        <div className="a11y-audit-controls">
          <h3>Audit Controls</h3>
          
          <div className="a11y-audit-control-group">
            <button 
              className="a11y-audit-button a11y-audit-button-primary"
              onClick={handleRequestAudit}
              aria-label="Run new accessibility audit"
            >
              Run New Audit
            </button>
            
            <div className="a11y-audit-toggle">
              <label 
                htmlFor="auto-audit-toggle"
                className="a11y-audit-toggle-label"
              >
                Automatic Audits
              </label>
              <input
                id="auto-audit-toggle"
                type="checkbox"
                checked={autoAuditEnabled}
                onChange={handleToggleAutoAudit}
                aria-label="Enable automatic accessibility audits"
              />
            </div>
            
            <div className="a11y-audit-input-group">
              <label 
                htmlFor="audit-interval-input"
                className="a11y-audit-input-label"
              >
                Interval (minutes)
              </label>
              <input
                id="audit-interval-input"
                type="number"
                min="5"
                max="1440"
                value={auditInterval}
                onChange={handleAuditIntervalChange}
                disabled={!autoAuditEnabled}
                aria-label="Audit interval in minutes"
              />
            </div>
            
            <div className="a11y-audit-input-group">
              <label 
                htmlFor="webhook-url-input"
                className="a11y-audit-input-label"
              >
                Webhook URL
              </label>
              <div className="a11y-audit-webhook-input">
                <input
                  id="webhook-url-input"
                  type="url"
                  value={webhookUrl}
                  onChange={handleWebhookUrlChange}
                  placeholder="https://example.com/webhook"
                  aria-label="Webhook URL for audit results"
                />
                <button
                  className="a11y-audit-button"
                  onClick={handleSaveWebhookUrl}
                  aria-label="Save webhook URL"
                >
                  Save
                </button>
              </div>
            </div>
            
            <button 
              className="a11y-audit-button a11y-audit-button-danger"
              onClick={handleClearHistory}
              aria-label="Clear audit history"
            >
              Clear History
            </button>
          </div>
        </div>
      )}
      
      {/* Audit History */}
      <div className="a11y-audit-history">
        <h3>Audit History</h3>
        
        {auditHistory.length === 0 ? (
          <p className="a11y-audit-empty-message">No audit history available.</p>
        ) : (
          <div className="a11y-audit-history-container">
            <div className="a11y-audit-history-list">
              {auditHistory.map((audit) => (
                <button
                  key={audit.id}
                  className={`a11y-audit-history-item ${selectedAuditId === audit.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAuditId(audit.id)}
                  aria-selected={selectedAuditId === audit.id}
                  aria-label={`Audit from ${new Date(audit.timestamp).toLocaleString()} with ${audit.violationCount} violations`}
                >
                  <div className="a11y-audit-history-item-header">
                    <span className="a11y-audit-history-item-component">
                      {audit.component || 'Page Audit'}
                    </span>
                    <span className="a11y-audit-history-item-date">
                      {new Date(audit.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="a11y-audit-history-item-stats">
                    <span className="a11y-audit-violation-count">
                      Violations: {audit.violationCount}
                    </span>
                    {audit.criticalCount > 0 && (
                      <span className="a11y-audit-critical-count">
                        Critical: {audit.criticalCount}
                      </span>
                    )}
                    {audit.seriousCount > 0 && (
                      <span className="a11y-audit-serious-count">
                        Serious: {audit.seriousCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Selected Audit Details */}
            {selectedAudit && (
              <div className="a11y-audit-details">
                <h3>Audit Details</h3>
                
                <div className="a11y-audit-details-header">
                  <div className="a11y-audit-details-component">
                    <strong>Component:</strong> {selectedAudit.component || 'Page Audit'}
                  </div>
                  <div className="a11y-audit-details-date">
                    <strong>Date:</strong> {new Date(selectedAudit.timestamp).toLocaleString()}
                  </div>
                  <div className="a11y-audit-details-url">
                    <strong>URL:</strong> {selectedAudit.results.url}
                  </div>
                </div>
                
                <div className="a11y-audit-details-summary">
                  <h4>Summary</h4>
                  <div className="a11y-audit-summary-stats">
                    <div className="a11y-audit-stat">
                      <span className="a11y-audit-stat-label">Violations</span>
                      <span className="a11y-audit-stat-value">{selectedAudit.violationCount}</span>
                    </div>
                    <div className="a11y-audit-stat">
                      <span className="a11y-audit-stat-label">Critical</span>
                      <span className="a11y-audit-stat-value">{selectedAudit.criticalCount}</span>
                    </div>
                    <div className="a11y-audit-stat">
                      <span className="a11y-audit-stat-label">Serious</span>
                      <span className="a11y-audit-stat-value">{selectedAudit.seriousCount}</span>
                    </div>
                    <div className="a11y-audit-stat">
                      <span className="a11y-audit-stat-label">Passes</span>
                      <span className="a11y-audit-stat-value">{selectedAudit.passCount}</span>
                    </div>
                    <div className="a11y-audit-stat">
                      <span className="a11y-audit-stat-label">Incomplete</span>
                      <span className="a11y-audit-stat-value">{selectedAudit.incompleteCount}</span>
                    </div>
                  </div>
                </div>
                
                {/* Violations */}
                {selectedAudit.results.violations.length > 0 ? (
                  <div className="a11y-audit-violations">
                    <h4>Violations</h4>
                    <ul className="a11y-audit-violations-list">
                      {selectedAudit.results.violations.map((violation) => (
                        <li key={violation.id} className={`a11y-audit-violation a11y-audit-violation-${violation.impact}`}>
                          <div className="a11y-audit-violation-header">
                            <h5 className="a11y-audit-violation-title">{violation.help}</h5>
                            <span className="a11y-audit-violation-impact">{violation.impact}</span>
                          </div>
                          <p className="a11y-audit-violation-description">
                            {violation.description}
                          </p>
                          <div className="a11y-audit-violation-info">
                            <div className="a11y-audit-violation-id">
                              <strong>Rule ID:</strong> {violation.id}
                            </div>
                            <div className="a11y-audit-violation-tags">
                              <strong>Tags:</strong> {violation.tags.join(', ')}
                            </div>
                            <a
                              href={violation.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="a11y-audit-violation-help-link"
                            >
                              Learn More
                            </a>
                          </div>
                          
                          <div className="a11y-audit-violation-nodes">
                            <h6>Affected Elements ({violation.nodes.length})</h6>
                            <ul className="a11y-audit-violation-nodes-list">
                              {violation.nodes.slice(0, 5).map((node, index) => (
                                <li key={index} className="a11y-audit-violation-node">
                                  <pre className="a11y-audit-violation-node-html">{node.html}</pre>
                                  {node.failureSummary && (
                                    <div className="a11y-audit-violation-node-failure">
                                      <strong>Failure:</strong> {node.failureSummary}
                                    </div>
                                  )}
                                </li>
                              ))}
                              {violation.nodes.length > 5 && (
                                <li className="a11y-audit-violation-node-more">
                                  ...and {violation.nodes.length - 5} more elements
                                </li>
                              )}
                            </ul>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="a11y-audit-no-violations">
                    <p>No violations found. Great job!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Rule Management */}
      {showRuleManagement && (
        <div className="a11y-audit-rules">
          <h3>Audit Rules</h3>
          
          <div className="a11y-audit-rules-header">
            <button
              className="a11y-audit-button"
              onClick={() => setIsAddingRule(true)}
              aria-label="Add new audit rule"
            >
              Add Rule
            </button>
          </div>
          
          {isAddingRule && (
            <div className="a11y-audit-add-rule-form">
              <h4>Add New Rule</h4>
              
              <div className="a11y-audit-form-group">
                <label htmlFor="new-rule-id" className="a11y-audit-form-label">
                  Rule ID
                </label>
                <input
                  id="new-rule-id"
                  type="text"
                  value={newRule.id}
                  onChange={(e) => setNewRule({ ...newRule, id: e.target.value })}
                  required
                />
              </div>
              
              <div className="a11y-audit-form-group">
                <label htmlFor="new-rule-description" className="a11y-audit-form-label">
                  Description
                </label>
                <input
                  id="new-rule-description"
                  type="text"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  required
                />
              </div>
              
              <div className="a11y-audit-form-group">
                <label htmlFor="new-rule-severity" className="a11y-audit-form-label">
                  Severity
                </label>
                <select
                  id="new-rule-severity"
                  value={newRule.severity as string}
                  onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                >
                  <option value="critical">Critical</option>
                  <option value="serious">Serious</option>
                  <option value="moderate">Moderate</option>
                  <option value="minor">Minor</option>
                </select>
              </div>
              
              <div className="a11y-audit-form-group">
                <label htmlFor="new-rule-tags" className="a11y-audit-form-label">
                  Tags (comma separated)
                </label>
                <input
                  id="new-rule-tags"
                  type="text"
                  value={newRule.tags?.join(', ') || ''}
                  onChange={(e) => setNewRule({ 
                    ...newRule, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                />
              </div>
              
              <div className="a11y-audit-form-group">
                <label className="a11y-audit-form-label">
                  <input
                    type="checkbox"
                    checked={newRule.enabled}
                    onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>
              
              <div className="a11y-audit-form-actions">
                <button
                  className="a11y-audit-button a11y-audit-button-secondary"
                  onClick={() => setIsAddingRule(false)}
                  aria-label="Cancel adding rule"
                >
                  Cancel
                </button>
                <button
                  className="a11y-audit-button a11y-audit-button-primary"
                  onClick={handleAddRule}
                  aria-label="Save new rule"
                >
                  Save
                </button>
              </div>
            </div>
          )}
          
          <ul className="a11y-audit-rules-list">
            {auditRules.map((rule) => (
              <li key={rule.id} className="a11y-audit-rule">
                <div className="a11y-audit-rule-header">
                  <div className="a11y-audit-rule-title">
                    <span className="a11y-audit-rule-id">{rule.id}</span>
                    <span className={`a11y-audit-rule-severity a11y-audit-rule-severity-${rule.severity}`}>
                      {rule.severity}
                    </span>
                  </div>
                  <label className="a11y-audit-rule-toggle">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => handleUpdateRule(rule.id, { enabled: e.target.checked })}
                      aria-label={`${rule.enabled ? 'Disable' : 'Enable'} rule ${rule.id}`}
                    />
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </label>
                </div>
                <p className="a11y-audit-rule-description">{rule.description}</p>
                {rule.tags.length > 0 && (
                  <div className="a11y-audit-rule-tags">
                    <strong>Tags:</strong> {rule.tags.join(', ')}
                  </div>
                )}
                <div className="a11y-audit-rule-actions">
                  <button
                    className="a11y-audit-button a11y-audit-button-danger"
                    onClick={() => handleRemoveRule(rule.id)}
                    aria-label={`Remove rule ${rule.id}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default A11yAuditDashboard;