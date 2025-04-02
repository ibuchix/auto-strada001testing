
/**
 * Validation utilities for edge functions
 */
import { logError } from './logging.ts';

/**
 * Enhanced error handling with specific error types
 */
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * API error with code for better error handling
 */
export class ApiError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * Validates if a VIN is properly formatted
 * @param vin Vehicle Identification Number to validate
 * @returns boolean indicating if VIN is valid
 */
export function isValidVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

/**
 * Validates a mileage value
 * @param mileage Vehicle mileage to validate
 * @returns boolean indicating if mileage is valid
 */
export function isValidMileage(mileage: number): boolean {
  return Number.isFinite(mileage) && mileage > 0 && mileage < 1000000;
}

/**
 * Helper function for retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logError('retry_attempt', { 
        attempt, 
        maxRetries, 
        error: error.message || 'Unknown error'
      }, 'warn');
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after maximum retries');
}

/**
 * Helper to safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logError('json_parse_error', { error: (error as Error).message }, 'warn');
    return defaultValue;
  }
}
