
/**
 * Cache implementation for handle-seller-operations
 * Created: 2025-04-19 - Moved from root directory to utils
 */

import { logOperation } from './logging.ts';

interface CacheEntry {
  value: any;
  timestamp: number;
}

// Simple in-memory cache for VIN validations
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache lifetime

/**
 * Get cached validation data for a VIN
 * @param vin The VIN to check cache for
 * @param mileage The mileage to check cache for (optional)
 * @returns The cached data or null if not found or expired
 */
export function getCachedValidation(vin: string, mileage?: number): any | null {
  const cacheKey = mileage ? `${vin}-${mileage}` : vin;
  const cachedEntry = cache.get(cacheKey);
  
  if (!cachedEntry) {
    return null;
  }
  
  const now = Date.now();
  
  // Check if entry is expired
  if (now - cachedEntry.timestamp > CACHE_TTL) {
    cache.delete(cacheKey);
    return null;
  }
  
  logOperation('cache_hit', { 
    vin, 
    mileage, 
    cacheAge: now - cachedEntry.timestamp 
  });
  
  return cachedEntry.value;
}

/**
 * Store validation data in cache
 * @param vin The VIN to cache data for
 * @param data The data to cache
 * @param mileage The mileage to associate with cache (optional)
 */
export function cacheValidation(vin: string, data: any, mileage?: number): void {
  const cacheKey = mileage ? `${vin}-${mileage}` : vin;
  
  cache.set(cacheKey, {
    value: data,
    timestamp: Date.now()
  });
  
  logOperation('cache_store', { vin, mileage });
  
  // Prune expired entries from cache occasionally
  if (Math.random() < 0.1) { // ~10% chance on each cache operation
    pruneExpiredCache();
  }
}

/**
 * Remove expired entries from cache
 */
function pruneExpiredCache(): void {
  const now = Date.now();
  let prunedCount = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
      prunedCount++;
    }
  }
  
  if (prunedCount > 0) {
    logOperation('cache_pruned', { 
      prunedCount, 
      remainingEntries: cache.size 
    });
  }
}
