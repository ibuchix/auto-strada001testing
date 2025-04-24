
/**
 * Cache cleanup service
 * Created: 2025-04-24
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { shouldUseCachedData } from "@/utils/valuation/validators/cacheValidator";
import { logCacheOperation } from "../utils/logger";

export class CacheCleanupService {
  constructor(private supabase: SupabaseClient) {}

  async cleanupInvalidCache(): Promise<void> {
    try {
      const { data: entries, error } = await this.supabase
        .from('vin_valuation_cache')
        .select('id, vin, valuation_data')
        .limit(100);
      
      if (error || !entries?.length) {
        return;
      }
      
      const invalidEntryIds = entries
        .filter(entry => !shouldUseCachedData(entry.valuation_data))
        .map(entry => entry.id);
      
      if (invalidEntryIds.length > 0) {
        const { error: deleteError } = await this.supabase
          .from('vin_valuation_cache')
          .delete()
          .in('id', invalidEntryIds);
          
        logCacheOperation('cleanup_complete', { 
          deletedCount: invalidEntryIds.length,
          error: deleteError?.message 
        });
      }
    } catch (error) {
      logCacheOperation('cleanup_error', { error });
    }
  }

  async cleanExpiredCache(): Promise<boolean> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error } = await this.supabase
        .from('vin_valuation_cache')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());
      
      return !error;
    } catch (error) {
      logCacheOperation('expired_cleanup_error', { error });
      return false;
    }
  }
}

