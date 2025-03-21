
/**
 * Changes made:
 * - 2024-10-15: Extracted API functionality from valuationService.ts
 * - 2025-04-28: Fixed TypeScript errors with method calls and return types
 */

import { ValuationServiceBase, ValuationData } from "./valuationServiceBase";
import { valuationCacheService } from "./cacheService";

export class ValuationApiService extends ValuationServiceBase {
  /**
   * Get valuation for a VIN with optimized cache checking
   */
  async getValuation(vin: string, mileage: number, gearbox: string): Promise<ValuationData | null> {
    try {
      // Check cache first for performance
      const cachedData = await valuationCacheService.getFromCache(vin, mileage);
      if (cachedData) {
        console.log('Using cached valuation data for VIN:', vin);
        return cachedData;
      }
      
      const { data, error } = await this.supabase.functions.invoke('get-vehicle-valuation', {
        body: { vin, mileage, gearbox, context: 'home' },
        // Add request timeout
        headers: { 'X-Request-Timeout': '15000' }
      });
      
      if (error) throw error;
      
      // Cache the data for future requests
      if (data) {
        await valuationCacheService.storeInCache(vin, mileage, data);
      }
      
      return data;
    } catch (error: any) {
      return this.handleValuationError(error, "Failed to get valuation");
    }
  }
  
  /**
   * Get seller valuation for VIN 
   */
  async getSellerValuation(vin: string, mileage: number, gearbox: string, userId: string): Promise<ValuationData | null> {
    try {
      const { data, error } = await this.supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Failed to validate VIN");
      }
      
      return data.data;
    } catch (error: any) {
      return this.handleValuationError(error, "Failed to get valuation");
    }
  }
}

// Export a singleton instance
export const valuationApiService = new ValuationApiService();
