
/**
 * API Client Service - Main export file
 * 
 * Changes made:
 * - 2025-11-05: Integrated with robust API client for automatic retries and error normalization
 * - 2025-11-06: Fixed TypeScript errors with array handling and config interfaces
 * - 2025-11-07: Added idempotency key support for preventing duplicate submissions
 * - 2025-11-11: Refactored into smaller files for better maintainability
 */

// Re-export the main API client singleton
export { apiClient } from './core/apiClient';

// Re-export types for convenience
export type { ApiRequestConfig, ApiResponse } from './types/apiTypes';

// Export utility functions if needed directly
export { makeRequest } from './utils/requestUtils';
export { normalizeError } from './utils/errorUtils';
export { DEFAULT_TIMEOUT, TimeoutDurations } from './constants/timeouts';
