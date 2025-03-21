
/**
 * Changes made:
 * - 2024-10-15: Created valuation cache service module
 * - 2024-10-17: Fixed permission errors with vin_valuation_cache access
 * - 2024-10-17: Added security definer function approach for robust cache access
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationServiceBase } from "./valuationServiceBase";
import { toast } from "sonner";
import { logDetailedError } from "@/components/hero/valuation/services/api/utils/debug-utils";

export class ValuationCacheService extends ValuationServiceBase {
  /**
   * Store valuation data in cache using security definer function to bypass RLS
   */
  async storeInCache(vin: string, mileage: number, valuationData: any): Promise<boolean> {
    try {
      console.log("ValuationCacheService: Attempting to store in cache using security definer function");
      
      // Generate a unique log ID for tracking this operation
      const logId = crypto.randomUUID();
      
      // Use the security definer function to bypass RLS
      const { data, error } = await supabase.rpc('store_vin_valuation_cache', {
        p_vin: vin,
        p_mileage: mileage,
        p_valuation_data: valuationData,
        p_log_id: logId
      });
      
      if (error) {
        console.error("ValuationCacheService: Error storing in cache via security definer function:", error);
        logDetailedError("Error in security definer function call", error);
        
        // Fall back to direct insert as a last resort
        return await this.fallbackDirectCacheInsert(vin, mileage, valuationData);
      }
      
      console.log("ValuationCacheService: Successfully stored in cache using security definer function");
      return true;
    } catch (error) {
      console.error("ValuationCacheService: Exception storing in cache:", error);
      logDetailedError("Exception in cache storage", error);
      
      // Fall back to direct insert as a last resort
      return await this.fallbackDirectCacheInsert(vin, mileage, valuationData);
    }
  }
  
  /**
   * Fallback method for direct cache insert
   * This is only used if the security definer function fails
   */
  private async fallbackDirectCacheInsert(vin: string, mileage: number, valuationData: any): Promise<boolean> {
    console.log("ValuationCacheService: Attempting fallback direct cache insert");
    
    try {
      // Check if record exists first
      const { data: existingCache, error: checkError } = await supabase
        .from('vin_valuation_cache')
        .select('id')
        .eq('vin', vin)
        .maybeSingle();
      
      if (checkError) {
        console.error("ValuationCacheService: Error checking existing cache entry:", checkError);
        logDetailedError("Error in checking existing cache entry", checkError);
        return false;
      }
      
      if (existingCache) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('vin_valuation_cache')
          .update({
            mileage,
            valuation_data: valuationData,
            created_at: new Date().toISOString()
          })
          .eq('id', existingCache.id);
        
        if (updateError) {
          console.error("ValuationCacheService: Error updating cache:", updateError);
          logDetailedError("Error in updating cache", updateError);
          return false;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('vin_valuation_cache')
          .insert({
            vin,
            mileage,
            valuation_data: valuationData
          });
        
        if (insertError) {
          console.error("ValuationCacheService: Error inserting into cache:", insertError);
          logDetailedError("Error in inserting into cache", insertError);
          return false;
        }
      }
      
      console.log("ValuationCacheService: Fallback direct cache insert successful");
      return true;
    } catch (error) {
      console.error("ValuationCacheService: Exception in fallback direct cache insert:", error);
      logDetailedError("Exception in fallback direct cache insert", error);
      return false;
    }
  }
  
  /**
   * Retrieve valuation data from cache with robust error handling
   */
  async getFromCache(vin: string, mileage: number): Promise<any | null> {
    try {
      console.log("ValuationCacheService: Attempting to get from cache:", { vin, mileage });
      
      const { data, error } = await supabase
        .from('vin_valuation_cache')
        .select('valuation_data')
        .eq('vin', vin)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) {
        console.error("ValuationCacheService: Error getting from cache:", error);
        logDetailedError("Error in retrieving from cache", error);
        
        // Silent failure, will fall back to API call
        return null;
      }
      
      // Return null if no data is found
      if (!data || !data.valuation_data) {
        console.log("ValuationCacheService: No cache data found for VIN:", vin);
        return null;
      }
      
      console.log("ValuationCacheService: Found cached valuation data for VIN:", vin);
      return data.valuation_data;
    } catch (error) {
      console.error("ValuationCacheService: Exception getting from cache:", error);
      logDetailedError("Exception in retrieving from cache", error);
      
      // Silent failure, will fall back to API call
      return null;
    }
  }
}

// Export a singleton instance
export const valuationCacheService = new ValuationCacheService();
