
/**
 * Direct database storage strategy
 * Created: 2025-04-24
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { CacheOperationResult } from "../types/cache";
import { logCacheOperation } from "../utils/logger";

export class DirectStorageStrategy {
  constructor(private supabase: SupabaseClient) {}

  async store(vin: string, mileage: number, data: Json): Promise<CacheOperationResult> {
    try {
      const { error } = await this.supabase
        .from('vin_valuation_cache')
        .upsert({
          vin,
          mileage,
          valuation_data: data,
          created_at: new Date().toISOString()
        });
      
      if (!error) {
        logCacheOperation('direct_store_success', { vin });
        return { success: true };
      }
      
      logCacheOperation('direct_store_error', { vin, error });
      return { success: false, error: error.message };
    } catch (error) {
      logCacheOperation('direct_store_exception', { vin, error });
      return { success: false, error: String(error) };
    }
  }

  async retrieve(vin: string): Promise<CacheOperationResult> {
    try {
      const { data, error } = await this.supabase
        .from('vin_valuation_cache')
        .select('valuation_data')
        .eq('vin', vin)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!error && data?.valuation_data) {
        logCacheOperation('direct_retrieve_success', { vin });
        return { success: true, data: data.valuation_data };
      }
      
      logCacheOperation('direct_retrieve_error', { vin, error });
      return { success: false, error: error?.message };
    } catch (error) {
      logCacheOperation('direct_retrieve_exception', { vin, error });
      return { success: false, error: String(error) };
    }
  }
}

