import React, { useState, useEffect } from 'react';
import { A11yAuditDashboardProps, A11yIssue, A11ySeverity } from '../types/a11y';
import { A11yAuditBadge } from './A11yAuditBadge';
import { A11yAppScanner } from '../utils/a11yAppScanner';

export const A11yAuditDashboard: React.FC<A11yAuditDashboardProps> = ({ 
  scanResult, 
  onRescan 
}) => {
  const [localScanResult, setLocalScanResult] = useState(scanResult);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setLocalScanResult(scanResult);
  }, [scanResult]);

  const handleRescan = async () => {
    setIsScanning(true);
    try {
      const newScanResult = await A11yAppScanner.scanApplication();
      setLocalScanResult(newScanResult);
      onRescan?.();
    } catch (error) {
      console.error('Rescan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const renderIssuesByType = (severity?: A11ySeverity) => {
    if (!localScanResult) return null;

    const filteredIssues = severity 
      ? localScanResult.issues.filter(issue => issue.severity === severity)
      : localScanResult.issues;

    return (
      <div className="space-y-2">
        {filteredIssues.map((issue, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-md ${
              issue.severity === A11ySeverity.CRITICAL ? 'bg-red-100' :
              issue.severity === A11ySeverity.HIGH ? 'bg-orange-100' :
              issue.severity === A11ySeverity.MEDIUM ? 'bg-yellow-100' :
              'bg-green-100'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{issue.type}</div>
                <div className="text-sm text-gray-600">{issue.description}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                issue.severity === A11ySeverity.CRITICAL ? 'bg-red-500 text-white' :
                issue.severity === A11ySeverity.HIGH ? 'bg-orange-500 text-white' :
                issue.severity === A11ySeverity.MEDIUM ? 'bg-yellow-500 text-black' :
                'bg-green-500 text-white'
              }`}>
                {issue.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!localScanResult) {
    return (
      <div className="p-4 text-center">
        <p>No accessibility scan results available</p>
        <button 
          onClick={handleRescan} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Perform Scan
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Accessibility Audit</h2>
        <div className="flex items-center space-x-4">
          <A11yAuditBadge score={localScanResult.score} />
          <button 
            onClick={handleRescan} 
            disabled={isScanning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isScanning ? 'Scanning...' : 'Rescan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Summary</h3>
          <div className="bg-gray-100 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span>Total Issues:</span>
              <span className="font-bold">{localScanResult.totalIssues}</span>
            </div>
            <div className="flex justify-between">
              <span>Critical Issues:</span>
              <span className="font-bold text-red-600">
                {localScanResult.criticalIssues}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Issue Breakdown</h3>
          <div className="space-y-2">
            {Object.values(A11ySeverity).map(severity => (
              <div key={severity} className="flex justify-between items-center">
                <span className="capitalize">{severity} Severity Issues:</span>
                <span className="font-bold">
                  {localScanResult.issues.filter(issue => issue.severity === severity).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Detailed Issues</h3>
        <div className="space-y-6">
          {Object.values(A11ySeverity)
            .filter(severity => 
              localScanResult.issues.some(issue => issue.severity === severity)
            )
            .map(severity => (
              <div key={severity}>
                <h4 className={`text-lg font-semibold mb-2 capitalize ${
                  severity === A11ySeverity.CRITICAL ? 'text-red-600' :
                  severity === A11ySeverity.HIGH ? 'text-orange-600' :
                  severity === A11ySeverity.MEDIUM ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {severity} Severity Issues
                </h4>
                {renderIssuesByType(severity)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};