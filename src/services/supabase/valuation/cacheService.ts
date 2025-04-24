/**
 * Changes made:
 * - 2024-09-11: Created valuation service for all valuation-related operations
 * - 2024-09-19: Optimized queries and improved caching for better performance
 * - 2024-09-20: Fixed issue with function invoke options
 * - 2024-10-15: Refactored into smaller modules for better maintainability
 * - 2025-04-28: Fixed TypeScript errors with method names and interfaces
 * - 2025-05-01: Fixed method name inconsistencies for cache operations
 * - 2025-05-24: Added cache validation checks
 * - 2025-05-25: Added fallback to fresh API call when cache is invalid
 * - 2025-05-26: Added automatic cache cleanup for invalid entries
 * - 2025-05-27: Added detailed cache data structure logging
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
      console.log('Attempting to store valuation in cache:', { 
        vin, 
        mileage,
        dataStructure: {
          hasData: !!valuationData,
          topLevelKeys: Object.keys(valuationData || {}),
          hasPriceFields: !!(valuationData?.price_min || valuationData?.price_med),
          hasValuation: !!valuationData?.valuation,
          hasVehicleInfo: !!(valuationData?.make && valuationData?.model)
        }
      });
      
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
   * Fetch fresh valuation data from API
   */
  private async fetchFreshValuation(vin: string, mileage: number): Promise<ValuationData | null> {
    console.log('Fetching fresh valuation data for:', { vin, mileage });
    
    try {
      const { data, error } = await this.supabase.functions.invoke(
        'get-vehicle-valuation',
        {
          body: { 
            vin, 
            mileage,
            includeRawResponse: true
          }
        }
      );
      
      if (error) {
        console.error('Error fetching fresh valuation:', error);
        return null;
      }
      
      if (!data) {
        console.warn('No data returned from fresh valuation call');
        return null;
      }
      
      console.log('Fresh valuation data structure:', {
        hasData: !!data,
        topLevelKeys: Object.keys(data),
        dataTypes: Object.entries(data).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: typeof value
        }), {}),
        nestedStructures: Object.entries(data).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value && typeof value === 'object' ? 'nested object' : 'primitive'
        }), {}),
        priceFields: Object.entries(data).filter(([key]) => 
          key.toLowerCase().includes('price') || 
          key.toLowerCase().includes('value') ||
          key.toLowerCase().includes('valuation')
        ).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value
        }), {})
      });
      
      // Validate fresh data
      if (!shouldUseCachedData(data)) {
        console.warn('Fresh API data failed validation:', {
          hasRequiredFields: {
            make: !!data.make,
            model: !!data.model,
            year: !!data.year,
            pricing: !!(data.price_min || data.price_med || data.valuation)
          }
        });
        return null;
      }
      
      // Store valid fresh data in cache
      await this.storeInCache(vin, mileage, data);
      
      return data as ValuationData;
    } catch (error) {
      console.error('Exception fetching fresh valuation:', error);
      return null;
    }
  }

  /**
   * Get valuation data from cache with fallback to fresh API call
   */
  async getFromCache(vin: string, mileage: number): Promise<ValuationData | null> {
    try {
      console.log('Starting cache retrieval for:', { vin, mileage });
      
      // Before retrieving, clean up invalid entries
      await this.cleanupInvalidCache();
      
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
          console.log('RPC cache retrieval result:', {
            success: true,
            dataStructure: {
              hasData: !!rpcData,
              topLevelKeys: Object.keys(rpcData),
              hasPricingData: !!(rpcData.price_min || rpcData.price_med || rpcData.valuation),
              hasVehicleInfo: !!(rpcData.make && rpcData.model),
              timestamp: rpcData.created_at || 'unknown'
            }
          });
          
          // Validate cached data
          if (shouldUseCachedData(rpcData)) {
            console.log('Successfully retrieved and validated valuation from cache via RPC');
            return rpcData as ValuationData;
          }
          
          console.log('Cache validation failed, will try fresh API call');
          return await this.fetchFreshValuation(vin, mileage);
        }
        
        console.warn('RPC cache retrieval failed:', {
          error: rpcError,
          attempted: { vin, mileage }
        });
      } catch (rpcException) {
        console.warn('Exception in RPC cache retrieval:', {
          error: rpcException,
          context: { vin, mileage }
        });
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
          console.log('Direct cache retrieval result:', {
            success: true,
            dataStructure: {
              hasData: !!data.valuation_data,
              topLevelKeys: Object.keys(data.valuation_data),
              hasPricingData: !!(data.valuation_data.price_min || data.valuation_data.price_med || data.valuation_data.valuation),
              hasVehicleInfo: !!(data.valuation_data.make && data.valuation_data.model),
              timestamp: data.valuation_data.created_at || 'unknown'
            }
          });
          
          // Validate direct query data
          if (shouldUseCachedData(data.valuation_data)) {
            console.log('Successfully retrieved and validated valuation from cache via direct query');
            return data.valuation_data as ValuationData;
          }
          
          console.log('Direct cache validation failed, will try fresh API call');
          return await this.fetchFreshValuation(vin, mileage);
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
          console.log('Edge function cache retrieval result:', {
            success: true,
            dataStructure: {
              hasData: !!funcData.data,
              topLevelKeys: Object.keys(funcData.data),
              hasPricingData: !!(funcData.data.price_min || funcData.data.price_med || funcData.data.valuation),
              hasVehicleInfo: !!(funcData.data.make && funcData.data.model),
              timestamp: funcData.data.created_at || 'unknown'
            }
          });
          
          // Validate edge function data
          if (shouldUseCachedData(funcData.data)) {
            console.log('Successfully retrieved and validated valuation from cache via edge function');
            return funcData.data as ValuationData;
          }
          
          console.log('Edge function cache validation failed, will try fresh API call');
          return await this.fetchFreshValuation(vin, mileage);
        }
        
        console.warn('Edge function cache retrieval failed:', funcError || 'No data returned');
      } catch (funcException) {
        console.warn('Exception in edge function cache retrieval:', funcException);
      }
      
      // All cache methods failed, try fresh API call
      console.log('All cache methods failed, trying fresh API call');
      return await this.fetchFreshValuation(vin, mileage);
      
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
  }
  
  /**
   * Clean up invalid cache entries
   */
  private async cleanupInvalidCache(): Promise<void> {
    try {
      console.log('Starting cache cleanup...');
      
      // Get all cache entries
      const { data: entries, error } = await this.supabase
        .from('vin_valuation_cache')
        .select('id, vin, valuation_data')
        .limit(100); // Process in batches
      
      if (error) {
        console.warn('Failed to fetch cache entries for cleanup:', error);
        return;
      }
      
      if (!entries?.length) {
        console.log('No cache entries to clean up');
        return;
      }
      
      // Find invalid entries
      const invalidEntryIds = entries
        .filter(entry => !shouldUseCachedData(entry.valuation_data))
        .map(entry => entry.id);
      
      if (invalidEntryIds.length > 0) {
        console.log(`Found ${invalidEntryIds.length} invalid cache entries to clean up`);
        
        // Delete invalid entries
        const { error: deleteError } = await this.supabase
          .from('vin_valuation_cache')
          .delete()
          .in('id', invalidEntryIds);
        
        if (deleteError) {
          console.warn('Failed to delete invalid cache entries:', deleteError);
        } else {
          console.log(`Successfully cleaned up ${invalidEntryIds.length} invalid cache entries`);
        }
      } else {
        console.log('No invalid cache entries found');
      }
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
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
