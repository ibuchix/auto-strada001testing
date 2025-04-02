
/**
 * Type definitions for the API client
 * 
 * Changes made:
 * - 2025-11-05: Created as part of apiClientService refactoring
 * - Extracted type definitions from monolithic apiClientService
 */

/**
 * Configuration options for API requests
 */
export interface ApiRequestConfig {
  retries?: number;
  timeout?: number;
  silent?: boolean;
  errorMessage?: string;
  successMessage?: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
}
