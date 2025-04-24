/**
 * Changes made:
 * - 2024-09-11: Created valuation service for all valuation-related operations
 * - 2024-09-19: Optimized queries and improved caching for better performance
 * - 2024-09-20: Fixed issue with function invoke options
 * - 2024-10-15: Refactored into smaller modules for better maintainability
 * - 2025-04-28: Fixed TypeScript errors with method names and interfaces
 * - 2025-05-01: Fixed method name inconsistencies for cache operations
 * - 2025-05-24: Added cache validation checks
 */

import { ValuationServiceBase, ValuationData } from "./valuationServiceBase";
import { Json } from "@/integrations/supabase/types";
import { PostgrestError } from "@supabase/supabase-js";
import { shouldUseCachedData } from "@/utils/valuation/validators/cacheValidator";

export class ValuationCacheService extends ValuationServiceBase {
  /**
   * Store valuation data in cache with multiple fallback mechanisms
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
      
      // Fallback 1: Direct insert
      try {
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
        
        if (!error) {
          console.log('Successfully stored valuation in cache via direct insert');
          return true;
        }
        
        console.warn('Direct cache storage failed:', error);
      } catch (directException) {
        console.warn('Exception in direct cache storage:', directException);
      }
      
      // Fallback 2: Edge function
      try {
        console.log('Attempting to store valuation via edge function fallback');
        const { data: funcData, error: funcError } = await this.supabase.functions.invoke(
          'handle-seller-operations',
          {
            body: {
              operation: 'cache_valuation',
              vin,
              mileage,
              valuation_data: valuationData
            }
          }
        );
        
        if (!funcError) {
          console.log('Successfully stored valuation in cache via edge function');
          return true;
        }
        
        console.warn('Edge function cache storage failed:', funcError);
      } catch (funcException) {
        console.warn('Exception in edge function cache storage:', funcException);
      }
      
      // If we reach here, all storage methods failed
      this.handleCacheError('All cache storage methods failed', "Failed to store valuation in cache");
      return false;
    } catch (error: any) {
      this.handleCacheError(error instanceof PostgrestError ? error.message : String(error), "Failed to store valuation in cache");
      return false;
    }
  }
  
  /**
   * Get valuation data from cache with multiple fallback methods
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
          // Add validation check here
          if (shouldUseCachedData(rpcData)) {
            console.log('Successfully retrieved and validated valuation from cache via RPC');
            return rpcData as ValuationData;
          } else {
            console.log('Cache validation failed, will try fresh API call');
            return null;
          }
        }
        
        console.warn('RPC cache retrieval failed, falling back to direct:', rpcError);
      } catch (rpcException) {
        console.warn('Exception in RPC cache retrieval:', rpcException);
      }
      
      // Fallback 1: Direct query
      try {
        const { data, error } = await this.supabase
          .from('vin_valuation_cache')
          .select('valuation_data')
          .eq('vin', vin)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!error && data && data.valuation_data) {
          console.log('Successfully retrieved valuation from cache via direct query');
          return data.valuation_data as ValuationData;
        }
        
        console.warn('Direct cache retrieval failed:', error || 'No data found');
      } catch (directException) {
        console.warn('Exception in direct cache retrieval:', directException);
      }
      
      // Fallback 2: Edge function
      try {
        console.log('Attempting to retrieve valuation via edge function fallback');
        const { data: funcData, error: funcError } = await this.supabase.functions.invoke(
          'handle-seller-operations',
          {
            body: {
              operation: 'get_cached_valuation',
              vin,
              mileage
            }
          }
        );
        
        if (!funcError && funcData && funcData.data) {
          console.log('Successfully retrieved valuation from cache via edge function');
          return funcData.data as ValuationData;
        }
        
        console.warn('Edge function cache retrieval failed:', funcError || 'No data returned');
      } catch (funcException) {
        console.warn('Exception in edge function cache retrieval:', funcException);
      }
      
      console.log('No cached valuation found after trying all methods');
      return null;
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
