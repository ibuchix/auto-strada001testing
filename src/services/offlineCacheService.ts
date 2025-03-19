
/**
 * Changes made:
 * - 2024-10-15: Created a central service for offline data caching
 * - 2024-12-16: Fixed JSON parsing error by adding safe parsing logic for string values
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
  LAST_AUCTIONS: 'lastAuctions'
};

/**
 * Save data to the cache
 */
export const saveToCache = <T>(key: string, data: T): void => {
  try {
    // If data is a string, store it directly
    if (typeof data === 'string') {
      localStorage.setItem(key, data);
    } else {
      // For objects and other types, use JSON.stringify
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Failed to save data to cache (${key}):`, error);
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
      console.warn(`Failed to parse JSON from cache (${key}), returning raw string:`, parseError);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Failed to get data from cache (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove data from the cache
 */
export const removeFromCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove data from cache (${key}):`, error);
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
  } catch (error) {
    console.error('Failed to clear cache:', error);
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
    } catch (error) {
      console.error('Failed to process pending request:', error);
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
