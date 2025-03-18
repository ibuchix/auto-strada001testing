
/**
 * Changes made:
 * - 2024-06-22: Enhanced with checksum calculation functionality from operations.ts
 * - 2024-07-07: Added rate limiting, improved error handling, and enhanced logging
 * - 2024-07-15: Added caching for recent VIN validations
 * - 2024-07-22: Refactored into multiple smaller modules
 */

// Re-export from individual modules for backward compatibility
export * from './validation-utils.ts';
export * from './cache.ts';
export * from './rate-limiter.ts';
export * from './logging.ts';

// CORS headers used across various functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
