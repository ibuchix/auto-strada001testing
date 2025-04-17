
/**
 * Rate limiting implementation for VIN validation
 */

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; firstRequest: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export function checkRateLimit(vin: string): boolean {
  const now = Date.now();
  const key = `rate_limit:${vin}`;
  
  const rateLimitData = rateLimitCache.get(key);
  
  if (!rateLimitData) {
    rateLimitCache.set(key, {
      count: 1,
      firstRequest: now,
      lastRequest: now
    });
    return false;
  }
  
  rateLimitData.count += 1;
  rateLimitData.lastRequest = now;
  
  const isRateLimited = 
    rateLimitData.count > 15 &&
    (now - rateLimitData.firstRequest) < RATE_LIMIT_WINDOW;
  
  if (now - rateLimitData.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitData.count = 1;
    rateLimitData.firstRequest = now;
  }
  
  rateLimitCache.set(key, rateLimitData);
  
  return isRateLimited;
}
