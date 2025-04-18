
/**
 * Shared utilities for Supabase Edge Functions
 * Created: 2025-04-18
 */

// Re-export shared types
export * from './types.ts';

// Re-export database utilities
export * from './client.ts';

// Re-export CORS utilities
export * from './cors.ts';

// Re-export validation utilities 
export * from './validation.ts';

// Re-export caching utilities
export * from './cache.ts';

// Re-export checksum utilities
export * from './checksum.ts';

// Re-export logging utilities
export * from './logging.ts';

// Re-export reserve price calculator
export { calculateReservePrice } from './reserve-price.ts';

// Export common error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;
