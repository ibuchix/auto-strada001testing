/**
 * Changes made:
 * - 2027-07-23: Created diagnostic utility for troubleshooting listing button issues
 * - 2027-07-27: Enhanced diagnostic logging with more detailed navigation tracking
 */

// Helper to generate a unique ID for each diagnostic session
export const generateDiagnosticId = () => {
  return Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
};

// Central diagnostic logging function
export const logDiagnostic = (
  category: string, 
  message: string, 
  data: any = null, 
  diagnosticId?: string
) => {
  const timestamp = new Date().toISOString();
  const id = diagnosticId || generateDiagnosticId();
  
  console.log(`[${timestamp}] [${category}] [${id}] ${message}`, data);
  
  // Store the last 10 diagnostic events in localStorage for debugging
  try {
    const existingDiagnostics = JSON.parse(localStorage.getItem('diagnosticEvents') || '[]');
    const newEntry = {
      timestamp,
      category,
      message,
      data,
      id
    };
    
    // Keep only the last 10 events
    const updatedDiagnostics = [newEntry, ...existingDiagnostics].slice(0, 10);
    localStorage.setItem('diagnosticEvents', JSON.stringify(updatedDiagnostics));
  } catch (error) {
    console.error('Failed to store diagnostic event', error);
  }
  
  return id;
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
export const logStorageState = (diagnosticId: string, eventName: string) => {
  // Extract relevant localStorage items related to valuation and navigation
  const storageItems = [
    'valuationData', 
    'tempVIN', 
    'tempMileage', 
    'tempGearbox',
    'tempMake',
    'tempModel',
    'tempYear',
    'navigationRecentAttempt',
    'navigationAttemptCount',
    'lastButtonClickTime',
    'lastButtonClickId',
    'buttonMountTime',
    'buttonUnmountTime'
  ];
  
  const storageData: Record<string, any> = {};
  let storageSize = 0;
  
  for (const key of storageItems) {
    const value = localStorage.getItem(key);
    if (value) {
      storageData[key] = key === 'valuationData' ? 'present' : value;
      storageSize += value.length;
    } else {
      storageData[key] = 'missing';
    }
  }
  
  logDiagnostic(
    'STORAGE_STATE', 
    `localStorage state at ${eventName}`, 
    {
      ...storageData,
      totalItemsTracked: storageItems.length,
      storageSize: `${(storageSize / 1024).toFixed(2)} KB`
    }, 
    diagnosticId
  );
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
