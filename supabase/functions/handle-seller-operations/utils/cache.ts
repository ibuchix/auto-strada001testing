
/**
 * Cache implementation
 * Created: 2025-04-19 - Extracted from shared module
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Get a value from cache if it exists and hasn't expired
 * @param key Cache key
 * @returns The cached value or null if not found/expired
 */
export function getCached(key: string): any {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Store a value in cache
 * @param key Cache key
 * @param data Data to cache
 */
export function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cached valuation data for a VIN
 * @param vin Vehicle identification number
 * @param mileage Optional mileage parameter
 * @returns Cached valuation data or null
 */
export function getCachedValidation(vin: string, mileage?: number): any {
  const key = mileage ? `${vin}_${mileage}` : vin;
  return getCached(key);
}

/**
 * Cache valuation data for a VIN
 * @param vin Vehicle identification number
 * @param data Valuation data to cache
 * @param mileage Optional mileage parameter
 */
export function cacheValidation(vin: string, data: any, mileage?: number): void {
  const key = mileage ? `${vin}_${mileage}` : vin;
  setCache(key, data);
}
