
/**
 * Changes made:
 * - 2024-09-19: Created cache service for valuation data
 * - 2024-09-20: Added error handling and cache expiration
 * - 2024-09-21: Optimized cache retrieval with fallback mechanisms
 * - 2024-10-15: Extracted from main valuation service
 * - 2025-04-28: Fixed TypeScript errors with method calls
 * - 2025-05-01: Fixed PostgrestError handling in error methods
 * - 2025-05-16: Fixed RPC function type errors using "as any" casting
 */

import { ValuationServiceBase, ValuationData } from "./valuationServiceBase";
import { Json } from "@/integrations/supabase/types";
import { PostgrestError } from "@supabase/supabase-js";

export class ValuationCacheService extends ValuationServiceBase {
  /**
   * Store valuation data in cache
   */
  async storeInCache(vin: string, mileage: number, valuationData: ValuationData): Promise<boolean> {
    try {
      console.log('Attempting to store valuation in cache:', { vin, mileage });
      
      // Try to use the security definer function first (most reliable)
      try {
        const { data: rpcData, error: rpcError } = await this.supabase.rpc(
          'store_vin_valuation_cache' as any,
          { 
            p_vin: vin,
            p_mileage: mileage,
            p_valuation_data: valuationData as Json
          }
        );
        
        if (!rpcError && rpcData) {
          console.log('Successfully stored valuation in cache via RPC');
          return true;
        }
        
        console.warn('RPC cache storage failed, falling back to direct:', rpcError);
      } catch (rpcException) {
        console.warn('Exception in RPC cache storage:', rpcException);
      }
      
      // Fallback to direct insert
      const { error } = await this.supabase
        .from('vin_valuation_cache')
        .upsert({
          vin,
          mileage,
          valuation_data: valuationData as Json,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        this.handleCacheError(error instanceof PostgrestError ? error.message : String(error), "Failed to store valuation in cache");
        return false;
      }
      
      return true;
    } catch (error: any) {
      this.handleCacheError(error instanceof PostgrestError ? error.message : String(error), "Failed to store valuation in cache");
      return false;
    }
  }
  
  /**
   * Get valuation data from cache
   */
  async getFromCache(vin: string, mileage: number): Promise<ValuationData | null> {
    try {
      // Try to use the security definer function first (most reliable)
      try {
        const { data: rpcData, error: rpcError } = await this.supabase.rpc(
          'get_vin_valuation_cache' as any,
          { 
            p_vin: vin,
            p_mileage: mileage
          }
        );
        
        if (!rpcError && rpcData) {
          console.log('Successfully retrieved valuation from cache via RPC');
          return rpcData as ValuationData;
        }
        
        console.warn('RPC cache retrieval failed, falling back to direct:', rpcError);
      } catch (rpcException) {
        console.warn('Exception in RPC cache retrieval:', rpcException);
      }
      
      // Fallback to direct query
      const { data, error } = await this.supabase
        .from('vin_valuation_cache')
        .select('valuation_data')
        .eq('vin', vin)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        this.handleCacheError(error instanceof PostgrestError ? error.message : String(error), "Failed to retrieve valuation from cache");
        return null;
      }
      
      if (!data || !data.valuation_data) {
        return null;
      }
      
      return data.valuation_data as ValuationData;
    } catch (error: any) {
      this.handleCacheError(error instanceof PostgrestError ? error.message : String(error), "Failed to retrieve valuation from cache");
      return null;
    }
  }
  
  /**
   * Handles cache-specific errors
   */
  private handleCacheError(error: string, defaultMessage: string): void {
    console.error(`${defaultMessage}:`, error);
    // Don't throw or show toast here - we want silent fallbacks for cache operations
  }
  
  /**
   * Clear expired cache entries (older than 30 days)
   */
  async cleanExpiredCache(): Promise<boolean> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error } = await this.supabase
        .from('vin_valuation_cache')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());
      
      if (error) {
        this.handleCacheError(error instanceof PostgrestError ? error.message : String(error), "Failed to clean expired cache");
        return false;
      }
      
      return true;
    } catch (error: any) {
      this.handleCacheError(error instanceof PostgrestError ? error.message : String(error), "Failed to clean expired cache");
      return false;
    }
  }
}

// Export a singleton instance
export const valuationCacheService = new ValuationCacheService();
