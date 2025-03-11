import { useState, useEffect } from 'react';
import { A11yAppScanner } from '../utils/a11yAppScanner';
import { A11yScanResult } from '../types/a11y';
import { A11yAuditService } from '../services/a11yAuditService';

export function useA11yAudit(autoScan: boolean = true) {
  const [scanResult, setScanResult] = useState<A11yScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const performAudit = async () => {
    try {
      setIsScanning(true);
      const result = await A11yAppScanner.scanApplication();
      
      // Optionally send results to a backend service
      await A11yAuditService.reportScanResults(result);
      
      setScanResult(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown scan error'));
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (autoScan) {
      performAudit();
    }
  }, [autoScan]);

  return {
    scanResult,
    isScanning,
    error,
    performAudit
  };
}