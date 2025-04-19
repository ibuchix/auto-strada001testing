
/**
 * Utility exports for validate-vin
 * Updated: 2025-04-19 - Organized and consolidated utilities
 */

export * from './cors.ts';
export * from './logging.ts';
export * from './validation.ts';
export * from './response.ts';
export * from './rate-limiting.ts';

// Export ValidationError class for convenience
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}
