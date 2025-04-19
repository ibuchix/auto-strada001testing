
/**
 * Rate limiting utilities for validate-vin
 * Created: 2025-04-19 - Extracted from utils.ts
 */

// In-memory store for rate limiting
const rateLimits = new Map<string, number[]>();

/**
 * Check if a request exceeds rate limits
 * @param key Identifier for rate limiting (e.g., IP, user ID, VIN)
 * @param limit Maximum number of requests in the time window
 * @param window Time window in milliseconds
 * @returns true if rate limit is exceeded, false otherwise
 */
export function checkRateLimit(key: string, limit: number = 5, window: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(key) || [];
  
  // Filter out old timestamps
  const recent = timestamps.filter(time => now - time < window);
  
  // Check if limit exceeded
  if (recent.length >= limit) {
    return true; // Rate limit exceeded
  }
  
  // Update timestamps
  recent.push(now);
  rateLimits.set(key, recent);
  
  return false; // Rate limit not exceeded
}

/**
 * Get current usage statistics for a key
 * @param key Identifier for rate limiting
 * @param window Time window in milliseconds
 * @returns Object with usage statistics
 */
export function getRateLimitStats(key: string, window: number = 60000): { count: number; remaining: number; reset: number } {
  const now = Date.now();
  const timestamps = rateLimits.get(key) || [];
  const recent = timestamps.filter(time => now - time < window);
  
  // Find oldest timestamp to determine when the window resets
  const oldestTimestamp = recent.length > 0 ? Math.min(...recent) : now;
  const resetTime = oldestTimestamp + window - now;
  
  return {
    count: recent.length,
    remaining: 5 - recent.length, // Assuming default limit of 5
    reset: resetTime
  };
}
