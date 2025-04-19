
/**
 * Utility exports for validate-vin
 * Updated: 2025-04-19 - Consolidated all utilities into a single export file
 */

export * from './cors';
export * from './logging';
export * from './validation';
export * from './response';

// Export error types that were previously in separate files
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

// Export rate limiting utilities
export function checkRateLimit(key: string, limit: number = 5, window: number = 60000): boolean {
  const now = Date.now();
  const rateLimits = new Map<string, number[]>();
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
