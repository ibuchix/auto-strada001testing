
/**
 * Rate limiting utilities for validate-vin
 * Created: 2025-04-19 - Moved from root directory to utils
 */

import { logOperation } from './logging.ts';

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; firstRequest: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute (milliseconds)
const MAX_REQUESTS_PER_WINDOW = 15; // Maximum requests per window per key

/**
 * Check if a request should be rate limited
 * @param key The key to rate limit on (usually VIN)
 * @returns Boolean indicating if request should be limited
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const cacheKey = `rate_limit:${key}`;
  
  // Get current rate limit data or create new entry
  const rateLimitData = rateLimitCache.get(cacheKey) || {
    count: 0,
    firstRequest: now,
    lastRequest: now
  };
  
  // Reset count if window has passed
  if (now - rateLimitData.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitData.count = 1;
    rateLimitData.firstRequest = now;
    rateLimitData.lastRequest = now;
    rateLimitCache.set(cacheKey, rateLimitData);
    return false;
  }
  
  // Increment count
  rateLimitData.count += 1;
  rateLimitData.lastRequest = now;
  
  // Check if over limit
  const isRateLimited = rateLimitData.count > MAX_REQUESTS_PER_WINDOW;
  
  // Log rate limiting
  if (isRateLimited) {
    logOperation('rate_limit_exceeded', { 
      key, 
      count: rateLimitData.count,
      window: RATE_LIMIT_WINDOW,
      firstRequest: new Date(rateLimitData.firstRequest).toISOString(),
      timeSinceFirstRequest: now - rateLimitData.firstRequest
    }, 'warn');
  }
  
  // Store updated data
  rateLimitCache.set(cacheKey, rateLimitData);
  
  return isRateLimited;
}

/**
 * Prune expired entries from the rate limit cache
 * Should be called periodically to prevent memory leaks
 */
export function pruneRateLimitCache(): void {
  const now = Date.now();
  let prunedCount = 0;
  
  for (const [key, data] of rateLimitCache.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW * 2) {
      rateLimitCache.delete(key);
      prunedCount++;
    }
  }
  
  if (prunedCount > 0) {
    logOperation('rate_limit_cache_pruned', { 
      prunedCount,
      remainingEntries: rateLimitCache.size
    });
  }
}

/**
 * Get current rate limit status for a key
 * @param key The key to check status for
 * @returns Rate limit status object or null if not being rate limited
 */
export function getRateLimitStatus(key: string): { 
  isLimited: boolean; 
  requestsRemaining: number;
  resetTime: number;
} | null {
  const cacheKey = `rate_limit:${key}`;
  const data = rateLimitCache.get(cacheKey);
  
  if (!data) {
    return null;
  }
  
  const now = Date.now();
  const resetTime = data.firstRequest + RATE_LIMIT_WINDOW;
  const isLimited = data.count > MAX_REQUESTS_PER_WINDOW && now < resetTime;
  const requestsRemaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - data.count);
  
  return {
    isLimited,
    requestsRemaining,
    resetTime
  };
}
