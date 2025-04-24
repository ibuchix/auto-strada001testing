
/**
 * Changes made:
 * - 2025-04-24: Removed caching mechanism to ensure direct API calls
 */

import { ValuationServiceBase, ValuationData } from "./valuationServiceBase";
import { logCacheOperation } from "./utils/logger";
import { CacheStorageOptions } from "./types/cache";

export class ValuationCacheService extends ValuationServiceBase {
  async storeInCache(): Promise<boolean> {
    // Caching disabled - always return true to not block main flow
    return true;
  }

  async getFromCache(): Promise<ValuationData | null> {
    // Caching disabled - always return null to force API call
    return null;
  }

  async cleanExpiredCache(): Promise<boolean> {
    // Caching disabled - no cleanup needed
    return true;
  }
}

// Export a singleton instance
export const valuationCacheService = new ValuationCacheService();
