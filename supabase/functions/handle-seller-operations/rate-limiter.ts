
/**
 * Changes made:
 * - 2024-07-22: Extracted rate limiting functionality from utils.ts
 */

import { logOperation } from './logging.ts';

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Maximum 10 requests per minute per VIN

/**
 * Check rate limits for a specific VIN
 * @param vin The VIN to check rate limits for
 * @returns boolean indicating if rate limit is exceeded
 */
export function checkRateLimit(vin: string): boolean {
  const now = Date.now();
  
  // Clean up expired rate limits
  for (const [key, limit] of rateLimits.entries()) {
    if (now > limit.resetTime) {
      rateLimits.delete(key);
    }
  }
  
  // Check if VIN exists in rate limiter
  if (!rateLimits.has(vin)) {
    rateLimits.set(vin, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  // Update and check limit
  const limit = rateLimits.get(vin)!;
  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    logOperation('rate_limit_exceeded', { vin }, 'warn');
    return true;
  }
  
  // Increment counter
  limit.count++;
  return false;
}
