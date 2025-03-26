
/**
 * Changes made:
 * - 2023-07-15: Created diagnostic utilities for listing process
 * - 2024-07-24: Added generateDiagnosticId function and fixed exports
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
 * Generate a unique diagnostic ID
 */
export function generateDiagnosticId(): string {
  return `diag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

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
 * Get all diagnostic logs from all sessions
 */
export function getDiagnosticLogs(): DiagnosticLog[] {
  return Object.values(diagnosticLogs).flat();
}

/**
 * Clear diagnostic logs for a specific ID
 */
export function clearDiagnostics(diagnosticId?: string): void {
  if (diagnosticId) {
    delete diagnosticLogs[diagnosticId];
  } else {
    // Clear all diagnostics if no ID provided
    Object.keys(diagnosticLogs).forEach(key => {
      delete diagnosticLogs[key];
    });
  }
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
