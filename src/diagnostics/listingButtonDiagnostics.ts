
/**
 * Utilities for diagnosing listing button functionality
 */

export type DiagnosticSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

interface DiagnosticEntry {
  id: string;
  type: string;
  message: string;
  details: any;
  timestamp: string;
  severity: DiagnosticSeverity;
}

// In-memory storage for diagnostics
const diagnostics: Record<string, DiagnosticEntry[]> = {};

/**
 * Generates a unique diagnostic ID for tracing
 */
export const generateDiagnosticId = (): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${random}`;
};

/**
 * Logs a diagnostic entry
 */
export const logDiagnostic = (
  type: string,
  message: string,
  details: any = {},
  diagnosticId: string = generateDiagnosticId(),
  severity: DiagnosticSeverity = 'INFO'
): string => {
  if (!diagnostics[diagnosticId]) {
    diagnostics[diagnosticId] = [];
  }

  const entry: DiagnosticEntry = {
    id: `${diagnosticId}-${diagnostics[diagnosticId].length}`,
    type,
    message,
    details,
    timestamp: new Date().toISOString(),
    severity
  };

  diagnostics[diagnosticId].push(entry);
  console.log(`[${diagnosticId}] ${severity} - ${type}: ${message}`, details);

  return diagnosticId;
};

/**
 * Gets all diagnostics for a specific ID
 */
export const getDiagnostics = (diagnosticId?: string): DiagnosticEntry[] => {
  if (diagnosticId && diagnostics[diagnosticId]) {
    return diagnostics[diagnosticId];
  }
  
  // If no ID provided or ID not found, return all diagnostics flattened
  return Object.values(diagnostics).flat();
};

/**
 * Logs the current state of localStorage
 */
export const logStorageState = (diagnosticId: string): void => {
  const storageItems: Record<string, string> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        storageItems[key] = localStorage.getItem(key) || '';
      } catch (e) {
        storageItems[key] = 'Error reading value';
      }
    }
  }
  
  logDiagnostic('STORAGE_STATE', 'Current localStorage state', storageItems, diagnosticId);
};

/**
 * Clears diagnostics for a specific ID or all if no ID provided
 */
export const clearDiagnostics = (diagnosticId?: string): void => {
  if (diagnosticId) {
    delete diagnostics[diagnosticId];
  } else {
    Object.keys(diagnostics).forEach(id => delete diagnostics[id]);
  }
};
