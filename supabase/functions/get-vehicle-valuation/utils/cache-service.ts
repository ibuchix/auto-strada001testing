
/**
 * Cache service utilities for get-vehicle-valuation
 * Created: 2025-04-19
 * Updated: 2025-04-24 - Disabled caching to ensure direct API calls
 */

import { logOperation } from './logging.ts';

export async function checkCache(): Promise<any> {
  // Caching disabled - always return null to force API call
  return null;
}

export async function storeInCache(): Promise<void> {
  // Caching disabled - no storage needed
  return;
}
