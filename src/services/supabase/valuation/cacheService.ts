
/**
 * Changes made:
 * - 2024-10-15: Extracted caching functionality from valuationService.ts
 */

import { ValuationServiceBase, ValuationData } from "./valuationServiceBase";

export class ValuationCacheService extends ValuationServiceBase {
  /**
   * Get cached valuation for a VIN if available
   * Optimized with specific column selection
   */
  async getCachedValuation(vin: string, mileage: number): Promise<ValuationData | null> {
    try {
      const { data, error } = await this.supabase
        .from('vin_valuation_cache')
        .select('valuation_data, created_at')
        .eq('vin', vin)
        // Only get cache entries where the mileage is within 5% of the requested mileage
        .gte('mileage', mileage * 0.95)
        .lte('mileage', mileage * 1.05)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Check if cache is expired (older than 30 days)
      const cacheDate = new Date(data[0].created_at);
      const now = new Date();
      const daysDifference = (now.getTime() - cacheDate.getTime()) / (1000 * 3600 * 24);
      
      if (daysDifference > 30) {
        return null;
      }
      
      return data[0].valuation_data as ValuationData;
    } catch (error: any) {
      console.error("Error fetching cached valuation:", error);
      return null;
    }
  }
  
  /**
   * Store valuation in cache with optimized insertion
   */
  async storeValuationCache(vin: string, mileage: number, valuationData: ValuationData): Promise<void> {
    try {
      // Check if an entry already exists to avoid duplication
      const { data, error: checkError } = await this.supabase
        .from('vin_valuation_cache')
        .select('id')
        .eq('vin', vin)
        .gte('mileage', mileage * 0.95)
        .lte('mileage', mileage * 1.05)
        .limit(1);
        
      if (checkError) {
        console.error("Error checking existing cache:", checkError);
        return;
      }
      
      // If entry exists, update it instead of inserting
      if (data && data.length > 0) {
        const { error } = await this.supabase
          .from('vin_valuation_cache')
          .update({ 
            valuation_data: valuationData,
            created_at: new Date().toISOString()
          })
          .eq('id', data[0].id);
          
        if (error) {
          console.error("Error updating valuation cache:", error);
        }
      } else {
        // Insert new cache entry
        const { error } = await this.supabase
          .from('vin_valuation_cache')
          .insert([{
            vin,
            mileage,
            valuation_data: valuationData
          }]);
          
        if (error) {
          console.error("Error storing valuation cache:", error);
        }
      }
    } catch (error: any) {
      console.error("Failed to store valuation in cache:", error);
    }
  }
}

// Export a singleton instance
export const valuationCacheService = new ValuationCacheService();
