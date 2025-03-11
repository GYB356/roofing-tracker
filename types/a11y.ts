export enum A11ySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum A11yIssueType {
  MISSING_ALT_TEXT = 'missing-alt-text',
  LOW_COLOR_CONTRAST = 'low-color-contrast',
  MISSING_FORM_LABEL = 'missing-form-label',
  MISSING_ARIA_LABEL = 'missing-aria-label',
  KEYBOARD_NAVIGATION = 'keyboard-navigation',
  SCREEN_READER_COMPATIBILITY = 'screen-reader-compatibility',
  SEMANTIC_HTML = 'semantic-html',
  FORM_ERROR = 'form-error',
  HEADING_STRUCTURE = 'heading-structure',
  LINK_PURPOSE = 'link-purpose'
}

export interface A11yIssue {
  id?: string;
  type: A11yIssueType | string;
  description: string;
  severity: A11ySeverity;
  element: Element;
  timestamp?: string;
  recommendation?: string;
  selector?: string;
  impact?: {
    users?: string[];
    technologies?: string[];
  };
  details?: Record<string, any>;
}

export interface A11yScanResult {
  id?: string;
  timestamp: string;
  totalIssues: number;
  criticalIssues: number;
  issues: A11yIssue[];
  score: number;
  environment?: {
    userAgent?: string;
    screenSize?: {
      width: number;
      height: number;
    };
    url?: string;
  };
  metadata?: Record<string, any>;
}

export interface A11yAuditBadgeProps {
  score: number;
  minimal?: boolean;
  className?: string;
}

export interface A11yAuditDashboardProps {
  scanResult?: A11yScanResult;
  onRescan?: () => void;
  hideRescan?: boolean;
}

export interface A11yComplianceReport {
  overallScore: number;
  severitySummary: {
    [key in A11ySeverity]: number;
  };
  topIssues: A11yIssue[];
  recommendedActions: string[];
  dateGenerated: string;
}

export interface A11yAuditConfig {
  scanInterval?: number;
  enabledScanTypes?: A11yIssueType[];
  severityThresholds?: {
    [key in A11ySeverity]: number;
  };
  notificationSettings?: {
    email?: string[];
    slack?: string;
    webhook?: string;
  };
}

export interface A11yValidationRule {
  type: A11yIssueType;
  validate: (element: Element) => boolean;
  getSeverity: (element: Element) => A11ySeverity;
  getMessage: (element: Element) => string;
} 