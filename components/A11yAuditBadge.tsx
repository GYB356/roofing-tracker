import React from 'react';
import { A11yAuditBadgeProps } from '../types/a11y';

export const A11yAuditBadge: React.FC<A11yAuditBadgeProps> = ({ 
  score, 
  minimal = false 
}) => {
  const getBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getAccessibilityLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const badgeColor = getBadgeColor(score);
  const accessibilityLabel = getAccessibilityLabel(score);

  if (minimal) {
    return (
      <div 
        className={`inline-block w-6 h-6 rounded-full ${badgeColor}`} 
        aria-label={`Accessibility Score: ${score}% - ${accessibilityLabel}`}
      />
    );
  }

  return (
    <div 
      className={`inline-flex items-center px-3 py-1 rounded-full ${badgeColor} text-white`}
      aria-label={`Accessibility Score: ${score}% - ${accessibilityLabel}`}
    >
      <span className="font-semibold mr-1">{score}%</span>
      <span className="text-sm">{accessibilityLabel}</span>
    </div>
  );
};