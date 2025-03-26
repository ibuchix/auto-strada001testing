/**
 * Changes made:
 * - 2028-06-01: Created dedicated diagnostics module for tracking form submission
 */

type DiagnosticSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

interface DiagnosticEntry {
  id: string;
  event: string;
  timestamp: string;
  severity: DiagnosticSeverity;
  data?: any;
  correlationId?: string;
}

/**
 * Log diagnostic information for troubleshooting form submissions
 */
export const logDiagnostic = (
  event: string, 
  message: string, 
  data?: any, 
  correlationId?: string,
  severity: DiagnosticSeverity = 'INFO'
) => {
  const entry: DiagnosticEntry = {
    id: crypto.randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    severity,
    data: {
      message,
      ...data
    },
    correlationId
  };

  // Log to console with enhanced visibility
  console.log(`[DIAGNOSTIC ${severity}][${entry.timestamp}][${event}]: ${message}`, data || '');
  
  // Store diagnostics in localStorage for retrieval
  try {
    const existingLogs = localStorage.getItem('formDiagnostics') || '[]';
    const parsedLogs = JSON.parse(existingLogs) as DiagnosticEntry[];
    
    // Keep only the most recent 100 entries to avoid localStorage overflow
    if (parsedLogs.length > 100) {
      parsedLogs.shift(); // Remove oldest entry
    }
    
    parsedLogs.push(entry);
    localStorage.setItem('formDiagnostics', JSON.stringify(parsedLogs));
  } catch (error) {
    console.error('Failed to store diagnostic data:', error);
  }
  
  return entry.id;
};

/**
 * Retrieve diagnostic entries for analysis
 */
export const getDiagnostics = (correlationId?: string): DiagnosticEntry[] => {
  try {
    const existingLogs = localStorage.getItem('formDiagnostics') || '[]';
    const parsedLogs = JSON.parse(existingLogs) as DiagnosticEntry[];
    
    if (correlationId) {
      return parsedLogs.filter(log => log.correlationId === correlationId);
    }
    
    return parsedLogs;
  } catch (error) {
    console.error('Failed to retrieve diagnostic data:', error);
    return [];
  }
};

/**
 * Clear all diagnostic entries
 */
export const clearDiagnostics = () => {
  localStorage.removeItem('formDiagnostics');
};

/**
 * Format diagnostic entries for export or display
 */
export const formatDiagnosticReport = (entries: DiagnosticEntry[]): string => {
  return entries.map(entry => {
    return `[${entry.timestamp}][${entry.severity}][${entry.event}]: ${entry.data?.message || ''}\n${
      entry.data ? JSON.stringify(entry.data, null, 2) : ''
    }\n-------------------------------------------`;
  }).join('\n');
};

/**
 * Get all diagnostic logs for display in the diagnostic viewer
 */
export const getDiagnosticLogs = (): any[] => {
  try {
    const existingLogs = localStorage.getItem('formDiagnostics') || '[]';
    const parsedLogs = JSON.parse(existingLogs) as DiagnosticEntry[];
    
    return parsedLogs.map(log => ({
      area: log.event,
      message: log.data?.message || '',
      data: JSON.stringify(log.data || {}, null, 2),
      timestamp: log.timestamp,
      severity: log.severity,
      sessionId: log.correlationId || 'unknown'
    }));
  } catch (error) {
    console.error('Failed to retrieve diagnostic logs:', error);
    return [];
  }
};
