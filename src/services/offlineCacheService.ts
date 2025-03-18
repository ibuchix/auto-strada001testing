/**
 * Changes made:
 * - 2024-10-15: Created a central service for offline data caching
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
    localStorage.setItem(key, JSON.stringify(data));
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
    return item ? JSON.parse(item) : defaultValue;
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
