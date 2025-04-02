
/**
 * Changes made:
 * - 2024-10-15: Extracted API functionality from valuationService.ts
 * - 2025-04-28: Fixed TypeScript errors with method calls and return types
 * - 2025-05-01: Fixed method name inconsistencies to match ValuationCacheService
 * - 2025-06-12: Updated to use consolidated handle-seller-operations endpoint
 * - 2025-06-15: Refactored to use consolidated approach with combined operations
 * - 2025-06-18: Updated to use dedicated get-vehicle-valuation endpoint for better separation of concerns
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
      
      // Use dedicated valuation endpoint instead of handle-seller-operations
      const { data, error } = await this.supabase.functions.invoke('get-vehicle-valuation', {
        body: { 
          vin, 
          mileage, 
          gearbox 
        },
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
      // For seller validation we still use handle-seller-operations as it needs to perform
      // additional seller-specific validation
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
