
/**
 * RPC-based cache storage strategy
 * Created: 2025-04-24
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { CacheOperationResult } from "../types/cache";
import { logCacheOperation } from "../utils/logger";

export class RpcStorageStrategy {
  constructor(private supabase: SupabaseClient) {}

  async store(vin: string, mileage: number, data: Json): Promise<CacheOperationResult> {
    try {
      const { data: rpcData, error: rpcError } = await this.supabase.rpc(
        'store_vin_valuation_cache',
        { 
          p_vin: vin,
          p_mileage: mileage,
          p_valuation_data: data
        }
      );
      
      if (!rpcError && rpcData) {
        logCacheOperation('rpc_store_success', { vin });
        return { success: true, data: rpcData };
      }
      
      logCacheOperation('rpc_store_error', { vin, error: rpcError });
      return { success: false, error: rpcError?.message };
    } catch (error) {
      logCacheOperation('rpc_store_exception', { vin, error });
      return { success: false, error: String(error) };
    }
  }

  async retrieve(vin: string, mileage: number): Promise<CacheOperationResult> {
    try {
      const { data: rpcData, error: rpcError } = await this.supabase.rpc(
        'get_vin_valuation_cache',
        { 
          p_vin: vin,
          p_mileage: mileage
        }
      );
      
      if (!rpcError && rpcData) {
        logCacheOperation('rpc_retrieve_success', { vin });
        return { success: true, data: rpcData };
      }
      
      logCacheOperation('rpc_retrieve_error', { vin, error: rpcError });
      return { success: false, error: rpcError?.message };
    } catch (error) {
      logCacheOperation('rpc_retrieve_exception', { vin, error });
      return { success: false, error: String(error) };
    }
  }
}

