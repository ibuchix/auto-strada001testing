/**
 * Changes made:
 * - 2024-10-15: Created a central service for offline data caching
 * - 2024-12-16: Fixed JSON parsing error by adding safe parsing logic for string values
 * - 2025-05-03: Added recovery mechanism and diagnostic logging
 * - 2025-08-29: Added TEMP_FORM_DATA key for form autosaving
 */

// Cache keys for different types of data
export const CACHE_KEYS = {
  VALUATION_DATA: 'valuationData',
  FORM_PROGRESS: 'formProgress',
  FORM_STEP: 'formCurrentStep',
  TEMP_VIN: 'tempVIN',
  TEMP_MILEAGE: 'tempMileage',
  TEMP_GEARBOX: 'tempGearbox',
  PENDING_REQUESTS: 'pendingRequests',
  USER_PROFILE: 'userProfile',
  LAST_AUCTIONS: 'lastAuctions',
  UPLOADED_PHOTOS: 'uploadedPhotos',
  FORM_SUBMISSION_STATE: 'formSubmissionState',
  FORM_BACKUP: 'formBackup',
  DIAGNOSTIC_ID: 'diagnosticId',
  TEMP_FORM_DATA: 'tempFormData' // Added this key for form autosaving
};

// Log function for debugging cache operations
const logCacheOperation = (operation: string, key: string, details?: any) => {
  const diagnosticId = getFromCache(CACHE_KEYS.DIAGNOSTIC_ID, '');
  const prefix = diagnosticId ? `[${diagnosticId}]` : '';
  console.log(`${prefix} [CacheService] ${operation}: ${key}`, details || '');
};

/**
 * Save data to the cache with backup mechanism
 */
export const saveToCache = <T>(key: string, data: T): void => {
  try {
    // Create backup before saving
    const timestamp = new Date().toISOString();
    const existingBackups = getFromCache<Record<string, any>>(CACHE_KEYS.FORM_BACKUP, {});
    
    // Keep backups organized by key
    const keyBackups = {...(existingBackups[key] || {})};
    keyBackups[timestamp] = localStorage.getItem(key); // Store previous value
    existingBackups[key] = keyBackups;
    
    // Only keep last 3 backups per key to avoid excessive storage use
    const timestamps = Object.keys(keyBackups).sort();
    if (timestamps.length > 3) {
      const toRemove = timestamps.slice(0, timestamps.length - 3);
      toRemove.forEach(ts => delete keyBackups[ts]);
      existingBackups[key] = keyBackups;
    }
    
    // Save the backup registry
    localStorage.setItem(CACHE_KEYS.FORM_BACKUP, JSON.stringify(existingBackups));
    
    // Now save the actual data
    if (typeof data === 'string') {
      localStorage.setItem(key, data);
    } else {
      // For objects and other types, use JSON.stringify
      localStorage.setItem(key, JSON.stringify(data));
    }
    
    logCacheOperation('Saved', key);
  } catch (error) {
    console.error(`Failed to save data to cache (${key}):`, error);
    logCacheOperation('Save Error', key, error);
  }
};

/**
 * Get data from the cache
 */
export const getFromCache = <T>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const item = localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    // Handle different expected return types
    if (defaultValue !== null) {
      // If defaultValue is a string, return the raw item
      if (typeof defaultValue === 'string') {
        return item as unknown as T;
      }
      
      // If defaultValue is a number, try to parse as number
      if (typeof defaultValue === 'number') {
        const num = Number(item);
        return !isNaN(num) ? num as unknown as T : defaultValue;
      }
      
      // If defaultValue is a boolean, handle specific boolean strings
      if (typeof defaultValue === 'boolean') {
        return (item === 'true' ? true : item === 'false' ? false : defaultValue) as unknown as T;
      }
    }
    
    // For complex objects, try JSON.parse with fallback to the raw value
    try {
      return JSON.parse(item) as T;
    } catch (parseError) {
      // If JSON parsing fails, return the raw string if that's what was expected
      if (typeof defaultValue === 'string' || defaultValue === null) {
        return item as unknown as T;
      }
      logCacheOperation('Parse Error', key, parseError);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Failed to get data from cache (${key}):`, error);
    logCacheOperation('Get Error', key, error);
    return defaultValue;
  }
};

/**
 * Remove data from the cache
 */
export const removeFromCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
    logCacheOperation('Removed', key);
  } catch (error) {
    console.error(`Failed to remove data from cache (${key}):`, error);
    logCacheOperation('Remove Error', key, error);
  }
};

/**
 * Clear all cached data
 */
export const clearCache = (): void => {
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    logCacheOperation('Cleared', 'all cache keys');
  } catch (error) {
    console.error('Failed to clear cache:', error);
    logCacheOperation('Clear Error', 'all cache', error);
  }
};

/**
 * Recover data from backup if available
 */
export const recoverFromBackup = (key: string): any | null => {
  try {
    const backups = getFromCache<Record<string, any>>(CACHE_KEYS.FORM_BACKUP, {});
    const keyBackups = backups[key] || {};
    
    // Get the most recent backup timestamp
    const timestamps = Object.keys(keyBackups).sort();
    if (timestamps.length === 0) {
      logCacheOperation('Recovery Failed', key, 'No backups available');
      return null;
    }
    
    const mostRecent = timestamps[timestamps.length - 1];
    const recoveredValue = keyBackups[mostRecent];
    
    if (recoveredValue) {
      // Restore the value
      localStorage.setItem(key, recoveredValue);
      logCacheOperation('Recovered', key, { timestamp: mostRecent });
      
      // Try to parse it for return
      try {
        return JSON.parse(recoveredValue);
      } catch (e) {
        return recoveredValue; // Return as string if it's not JSON
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to recover data from backup (${key}):`, error);
    logCacheOperation('Recovery Error', key, error);
    return null;
  }
};

/**
 * Store a request to be processed when back online
 */
export const storePendingRequest = (request: {
  endpoint: string;
  method: string;
  body: any;
  id: string;
}): void => {
  const pendingRequests = getFromCache<any[]>(CACHE_KEYS.PENDING_REQUESTS, []);
  pendingRequests?.push({
    ...request,
    timestamp: new Date().toISOString()
  });
  saveToCache(CACHE_KEYS.PENDING_REQUESTS, pendingRequests);
  logCacheOperation('Stored Pending Request', request.endpoint, { id: request.id });
};

/**
 * Process pending requests when back online
 */
export const processPendingRequests = async (processFn: (request: any) => Promise<any>): Promise<{
  processed: number;
  failed: number;
}> => {
  const pendingRequests = getFromCache<any[]>(CACHE_KEYS.PENDING_REQUESTS, []);
  
  if (!pendingRequests || pendingRequests.length === 0) {
    return { processed: 0, failed: 0 };
  }
  
  let processed = 0;
  let failed = 0;
  
  const remainingRequests = [];
  
  for (const request of pendingRequests) {
    try {
      await processFn(request);
      processed++;
      logCacheOperation('Processed Request', request.endpoint, { id: request.id });
    } catch (error) {
      console.error('Failed to process pending request:', error);
      logCacheOperation('Processing Failed', request.endpoint, { id: request.id, error });
      failed++;
      
      // Keep the request for retry if it's less than 24 hours old
      const requestTime = new Date(request.timestamp);
      const isLessThan24HoursOld = (new Date().getTime() - requestTime.getTime()) < 24 * 60 * 60 * 1000;
      
      if (isLessThan24HoursOld) {
        remainingRequests.push(request);
      }
    }
  }
  
  saveToCache(CACHE_KEYS.PENDING_REQUESTS, remainingRequests);
  
  return { processed, failed };
};

/**
 * Get diagnostic information about the current cache state
 */
export const getCacheState = (): Record<string, any> => {
  const state: Record<string, any> = {};
  
  try {
    // Get the size of each cache key
    Object.values(CACHE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      state[key] = {
        exists: item !== null,
        size: item ? item.length : 0,
        type: item ? (item.startsWith('{') || item.startsWith('[') ? 'JSON' : 'string') : 'none'
      };
    });
    
    // Get total localStorage usage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        totalSize += (key.length + (value?.length || 0));
      }
    }
    
    state._totalSize = totalSize;
    state._approximateUsage = `${Math.round(totalSize / 1024)} KB`;
    state._timestamp = new Date().toISOString();
    
    return state;
  } catch (error) {
    console.error('Failed to get cache state:', error);
    return { error: String(error) };
  }
};
