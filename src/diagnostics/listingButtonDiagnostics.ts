
/**
 * Changes made:
 * - 2028-07-14: Created diagnostics utilities for tracking form interactions and errors
 */

// Log a diagnostic event to the console and optionally to a storage service
export const logDiagnostic = (
  eventType: string,
  message: string,
  data?: Record<string, any> | null,
  diagnosticId?: string,
  level: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'
) => {
  // Only log if we have a diagnostic ID
  if (!diagnosticId) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    diagnosticId,
    eventType,
    message,
    data,
    timestamp,
    level
  };
  
  // Log to console with appropriate level
  switch (level) {
    case 'ERROR':
      console.error(`[DIAGNOSTIC] ${eventType}:`, logEntry);
      break;
    case 'WARNING':
      console.warn(`[DIAGNOSTIC] ${eventType}:`, logEntry);
      break;
    default:
      console.log(`[DIAGNOSTIC] ${eventType}:`, logEntry);
  }
  
  // Store diagnostics in localStorage for debugging
  try {
    const storageKey = `diagnostics_${diagnosticId}`;
    const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingLogs.push(logEntry);
    localStorage.setItem(storageKey, JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Failed to store diagnostic data:', error);
  }
  
  // In a real implementation, you might want to send this to a server
  // or analytics service for tracking issues
};

// Get all diagnostics for a given ID
export const getDiagnostics = (diagnosticId: string) => {
  try {
    const storageKey = `diagnostics_${diagnosticId}`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch (error) {
    console.error('Failed to retrieve diagnostic data:', error);
    return [];
  }
};

// Clear diagnostics for a given ID
export const clearDiagnostics = (diagnosticId: string) => {
  try {
    const storageKey = `diagnostics_${diagnosticId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear diagnostic data:', error);
  }
};
