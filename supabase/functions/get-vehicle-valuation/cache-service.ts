
import { logOperation } from "../_shared/logging.ts";

// Simple in-memory cache for demonstration
// In production, you would use a proper database or KV store
const cache: Record<string, {
  data: any;
  timestamp: number;
}> = {};

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Generate cache key from VIN and mileage
 */
function generateCacheKey(vin: string, mileage: number): string {
  return `${vin.toUpperCase()}_${mileage}`;
}

/**
 * Check if valuation exists in cache
 * 
 * @param vin Vehicle Identification Number
 * @param mileage Vehicle mileage
 * @param requestId For logging
 * @returns Cached data or null if not found or expired
 */
export async function checkCache(vin: string, mileage: number, requestId: string): Promise<any> {
  const cacheKey = generateCacheKey(vin, mileage);
  const cachedEntry = cache[cacheKey];
  
  if (!cachedEntry) {
    logOperation('cache_miss', { requestId, vin, mileage }, 'debug');
    return null;
  }
  
  // Check if cache entry is expired
  const now = Date.now();
  if (now - cachedEntry.timestamp > CACHE_TTL) {
    logOperation('cache_expired', { 
      requestId, 
      vin, 
      mileage,
      cachedAt: new Date(cachedEntry.timestamp).toISOString()
    }, 'debug');
    
    // Remove expired entry
    delete cache[cacheKey];
    return null;
  }
  
  logOperation('cache_hit', { 
    requestId, 
    vin, 
    mileage, 
    cachedAt: new Date(cachedEntry.timestamp).toISOString()
  }, 'debug');
  
  return cachedEntry.data;
}

/**
 * Store valuation result in cache
 * 
 * @param vin Vehicle Identification Number
 * @param mileage Vehicle mileage
 * @param data Data to cache
 * @param requestId For logging
 */
export async function storeInCache(vin: string, mileage: number, data: any, requestId: string): Promise<void> {
  const cacheKey = generateCacheKey(vin, mileage);
  
  cache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
  
  logOperation('cache_store', { 
    requestId, 
    vin, 
    mileage
  }, 'debug');
}
