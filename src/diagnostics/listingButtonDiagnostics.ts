
/**
 * Changes made:
 * - 2023-07-15: Created diagnostic utilities for listing process
 */

type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

interface DiagnosticLog {
  id: string;
  category: string;
  message: string;
  data?: any;
  timestamp: string;
  level: LogLevel;
}

// In-memory storage for diagnostic logs
const diagnosticLogs: Record<string, DiagnosticLog[]> = {};

/**
 * Log a diagnostic message
 */
export function logDiagnostic(
  category: string,
  message: string,
  data?: any,
  diagnosticId?: string, 
  level: LogLevel = 'INFO'
): void {
  if (!diagnosticId) {
    console.log(`[${category}] ${message}`, data);
    return;
  }
  
  const log: DiagnosticLog = {
    id: crypto.randomUUID(),
    category,
    message,
    data,
    timestamp: new Date().toISOString(),
    level
  };
  
  // Initialize array if it doesn't exist
  if (!diagnosticLogs[diagnosticId]) {
    diagnosticLogs[diagnosticId] = [];
  }
  
  // Add the log
  diagnosticLogs[diagnosticId].push(log);
  
  // Also log to console for debugging
  console.log(`[${diagnosticId}][${category}] ${message}`, data);
}

/**
 * Get all diagnostic logs for a specific ID
 */
export function getDiagnostics(diagnosticId: string): DiagnosticLog[] {
  return diagnosticLogs[diagnosticId] || [];
}

/**
 * Clear diagnostic logs for a specific ID
 */
export function clearDiagnostics(diagnosticId: string): void {
  delete diagnosticLogs[diagnosticId];
}

/**
 * Log the current state of localStorage
 */
export function logStorageState(diagnosticId: string, marker: string): void {
  try {
    const storageKeys = Object.keys(localStorage);
    const storageSizes = storageKeys.map(key => {
      const value = localStorage.getItem(key);
      return { 
        key, 
        size: value ? value.length : 0, 
        sizeKb: value ? Math.round(value.length / 1024 * 100) / 100 : 0 
      };
    });
    
    logDiagnostic('STORAGE_STATE', `Storage state at ${marker}`, {
      totalKeys: storageKeys.length,
      keys: storageSizes,
      timestamp: new Date().toISOString()
    }, diagnosticId);
  } catch (error) {
    logDiagnostic('STORAGE_ERROR', 'Failed to log storage state', { error }, diagnosticId, 'ERROR');
  }
}
