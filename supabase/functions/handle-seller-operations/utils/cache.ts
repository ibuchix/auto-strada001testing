
/**
 * Cache implementation for handle-seller-operations
 * Created: 2025-04-19
 * Updated: 2025-04-24 - Disabled caching to ensure direct API calls
 */

import { logOperation } from './logging.ts';

// These functions have been completely removed as part of the cache removal initiative
// They are kept as empty functions to prevent breaking existing imports
export function getCachedValidation(): null {
  return null;
}

export function cacheValidation(): void {
  return;
}

function pruneExpiredCache(): void {
  return;
}
