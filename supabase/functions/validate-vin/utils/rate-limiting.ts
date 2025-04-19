
/**
 * Rate limiting utilities for validate-vin
 * Created: 2025-04-19
 */

const rateLimits = new Map<string, {
  count: number,
  resetTime: number
}>();

/**
 * Check if a request exceeds rate limits
 * @param key Identifier for rate limiting (e.g., IP, user ID, VIN)
 * @param maxRequests Maximum allowed requests in time window
 * @param windowMs Time window in milliseconds
 * @returns True if rate limit exceeded, false otherwise
 */
export function isRateLimited(
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);
  
  // No existing record, create new one
  if (!record) {
    rateLimits.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return false;
  }
  
  // Reset counter if time window has passed
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return false;
  }
  
  // Increment counter and check limit
  record.count++;
  return record.count > maxRequests;
}

/**
 * Get remaining allowed requests
 * @param key Identifier for rate limiting
 * @returns Remaining requests or -1 if no record exists
 */
export function getRemainingRequests(key: string): number {
  const now = Date.now();
  const record = rateLimits.get(key);
  
  if (!record) {
    return -1;
  }
  
  if (now > record.resetTime) {
    return -1;
  }
  
  return Math.max(0, 10 - record.count);
}

/**
 * Get reset time for rate limit window
 * @param key Identifier for rate limiting
 * @returns Reset time in milliseconds or -1 if no record exists
 */
export function getResetTime(key: string): number {
  const record = rateLimits.get(key);
  return record ? record.resetTime : -1;
}

/**
 * Occasionally clean up expired rate limit records
 * This function should be called periodically
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  
  for (const [key, record] of rateLimits.entries()) {
    if (now > record.resetTime) {
      rateLimits.delete(key);
    }
  }
}
