
/**
 * Cache implementation for handle-seller-operations
 * Created: 2025-04-19
 * Updated: 2025-04-24 - Disabled caching to ensure direct API calls
 */

import { logOperation } from './logging.ts';

export function getCachedValidation(): any | null {
  // Caching disabled - always return null to force API call
  return null;
}

export function cacheValidation(): void {
  // Caching disabled - no storage needed
  return;
}

function pruneExpiredCache(): void {
  // Caching disabled - no cleanup needed
  return;
}
