
/**
 * Edge function storage strategy
 * Created: 2025-04-24
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { CacheOperationResult } from "../types/cache";
import { logCacheOperation } from "../utils/logger";

export class EdgeFunctionStorageStrategy {
  constructor(private supabase: SupabaseClient) {}

  async store(vin: string, mileage: number, data: Json): Promise<CacheOperationResult> {
    try {
      const { error } = await this.supabase.functions.invoke(
        'handle-seller-operations',
        {
          body: {
            operation: 'cache_valuation',
            vin,
            mileage,
            valuation_data: data
          }
        }
      );
      
      if (!error) {
        logCacheOperation('edge_store_success', { vin });
        return { success: true };
      }
      
      logCacheOperation('edge_store_error', { vin, error });
      return { success: false, error: String(error) };
    } catch (error) {
      logCacheOperation('edge_store_exception', { vin, error });
      return { success: false, error: String(error) };
    }
  }

  async retrieve(vin: string, mileage: number): Promise<CacheOperationResult> {
    try {
      const { data: funcData, error } = await this.supabase.functions.invoke(
        'handle-seller-operations',
        {
          body: {
            operation: 'get_cached_valuation',
            vin,
            mileage
          }
        }
      );
      
      if (!error && funcData?.data) {
        logCacheOperation('edge_retrieve_success', { vin });
        return { success: true, data: funcData.data };
      }
      
      logCacheOperation('edge_retrieve_error', { vin, error });
      return { success: false, error: String(error) };
    } catch (error) {
      logCacheOperation('edge_retrieve_exception', { vin, error });
      return { success: false, error: String(error) };
    }
  }
}

