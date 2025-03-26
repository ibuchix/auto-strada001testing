/**
 * Diagnostics utilities for tracking listing button interactions
 */

interface DiagnosticLog {
  id: string;
  event: string;
  message: string;
  data: Record<string, any>;
  timestamp: string;
  diagnostic_id: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
}

// In-memory storage for diagnostics
const diagnosticLogs: DiagnosticLog[] = [];

export const logDiagnostic = (
  event: string,
  message: string,
  data: Record<string, any> = {},
  diagnosticId: string,
  level: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'
): void => {
  const log: DiagnosticLog = {
    id: crypto.randomUUID(),
    event,
    message,
    data,
    timestamp: new Date().toISOString(),
    diagnostic_id: diagnosticId,
    level
  };

  // Add to in-memory store and localStorage
  diagnosticLogs.push(log);
  
  // Also save to localStorage for persistence
  try {
    const existingLogs = JSON.parse(localStorage.getItem('diagnosticLogs') || '[]');
    const updatedLogs = [...existingLogs, log];
    
    // Keep only the last 100 logs to prevent excessive storage
    if (updatedLogs.length > 100) {
      updatedLogs.splice(0, updatedLogs.length - 100);
    }
    
    localStorage.setItem('diagnosticLogs', JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Failed to save diagnostic log to localStorage:', e);
  }

  // Log to console for immediate visibility
  console.log(`[${log.level}] ${event}: ${message}`, data);
};

export const getDiagnostics = (): DiagnosticLog[] => {
  // Combine in-memory logs with those from localStorage
  try {
    const localStorageLogs = JSON.parse(localStorage.getItem('diagnosticLogs') || '[]');
    
    // Merge and deduplicate logs based on id
    const allLogs = [...diagnosticLogs, ...localStorageLogs];
    const uniqueLogs = allLogs.filter((log, index, self) => 
      index === self.findIndex(l => l.id === log.id)
    );
    
    // Sort by timestamp, newest first
    return uniqueLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (e) {
    console.error('Failed to retrieve diagnostic logs:', e);
    return diagnosticLogs;
  }
};

export const clearDiagnostics = (): void => {
  // Clear both in-memory and localStorage logs
  diagnosticLogs.length = 0;
  localStorage.removeItem('diagnosticLogs');
};

// Helper to log the state of relevant localStorage items
export const logStorageState = (diagnosticId: string): void => {
  try {
    const storageKeys = [
      'valuationData',
      'tempVIN',
      'tempMileage',
      'tempGearbox',
      'vinReservationId',
      'formData'
    ];
    
    const storageState: Record<string, any> = {};
    
    storageKeys.forEach(key => {
      const value = localStorage.getItem(key);
      storageState[key] = value ? 
        (key === 'valuationData' || key === 'formData' ? 'present (JSON)' : value) : 
        'not present';
    });
    
    logDiagnostic(
      'STORAGE_STATE',
      'Current localStorage state',
      storageState,
      diagnosticId
    );
  } catch (e) {
    console.error('Failed to log storage state:', e);
  }
};
