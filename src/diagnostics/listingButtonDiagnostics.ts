/**
 * Changes made:
 * - 2027-07-23: Created diagnostic utility for troubleshooting listing button issues
 */

// Helper to generate a unique ID for each diagnostic session
export const generateDiagnosticId = () => {
  return Math.random().toString(36).substring(2, 10);
};

// Central diagnostic logging function
export const logDiagnostic = (
  area: string, 
  message: string, 
  data?: any, 
  diagnosticId?: string
) => {
  const timestamp = new Date().toISOString();
  const sessionId = diagnosticId || 'unknown-session';
  
  console.log(`DIAGNOSTIC[${sessionId}][${area}] ${timestamp} - ${message}`, data || '');
  
  try {
    // Store in sessionStorage for persistence across page loads
    const currentLogs = JSON.parse(sessionStorage.getItem('listingDiagnostics') || '[]');
    currentLogs.push({
      timestamp,
      sessionId,
      area,
      message,
      data: data ? JSON.stringify(data) : undefined
    });
    
    // Keep only the last 100 logs to prevent storage issues
    if (currentLogs.length > 100) {
      currentLogs.shift();
    }
    
    sessionStorage.setItem('listingDiagnostics', JSON.stringify(currentLogs));
  } catch (error) {
    console.error('Error storing diagnostic log:', error);
  }
};

// Clear all diagnostic data
export const clearDiagnostics = () => {
  try {
    sessionStorage.removeItem('listingDiagnostics');
    console.log('Diagnostic logs cleared');
  } catch (error) {
    console.error('Error clearing diagnostic logs:', error);
  }
};

// Helper to log all relevant localStorage data
export const logStorageState = (sessionId: string, context: string) => {
  try {
    const valuationData = localStorage.getItem('valuationData');
    const tempVIN = localStorage.getItem('tempVIN');
    const tempMileage = localStorage.getItem('tempMileage');
    const tempGearbox = localStorage.getItem('tempGearbox');
    const formCurrentStep = localStorage.getItem('formCurrentStep');
    const navigationInProgress = localStorage.getItem('navigationInProgress');
    const navigationStartTime = localStorage.getItem('navigationStartTime');
    
    logDiagnostic('STORAGE', `Storage state at ${context}`, {
      valuationData: valuationData ? JSON.parse(valuationData) : null,
      tempVIN,
      tempMileage,
      tempGearbox,
      formCurrentStep,
      navigationInProgress,
      navigationStartTime,
      allKeys: Object.keys(localStorage)
    }, sessionId);
  } catch (error) {
    logDiagnostic('STORAGE', 'Error logging storage state', { error }, sessionId);
  }
};

// Export diagnostic viewer component
export const getDiagnosticLogs = () => {
  try {
    return JSON.parse(sessionStorage.getItem('listingDiagnostics') || '[]');
  } catch (error) {
    console.error('Error retrieving diagnostic logs:', error);
    return [];
  }
};
