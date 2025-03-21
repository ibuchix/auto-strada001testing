
/**
 * Changes made:
 * - 2024-09-11: Created valuation service for all valuation-related operations
 * - 2024-09-19: Optimized queries and improved caching for better performance
 * - 2024-09-20: Fixed issue with function invoke options
 * - 2024-10-15: Refactored into smaller modules for better maintainability
 */

import { ValuationApiService, valuationApiService } from "./valuation/apiService";
import { ValuationCacheService, valuationCacheService } from "./valuation/cacheService";
import { ValuationListingService, valuationListingService } from "./valuation/listingService";
import { ValuationData } from "./valuation/valuationServiceBase";

/**
 * Main valuation service that combines all the valuation-related functionality
 */
class ValuationService {
  private apiService: ValuationApiService = valuationApiService;
  private cacheService: ValuationCacheService = valuationCacheService;
  private listingService: ValuationListingService = valuationListingService;

  /**
   * Get valuation for a VIN with optimized cache checking
   */
  async getValuation(vin: string, mileage: number, gearbox: string): Promise<ValuationData | null> {
    return this.apiService.getValuation(vin, mileage, gearbox);
  }
  
  /**
   * Get cached valuation for a VIN
   */
  async getCachedValuation(vin: string, mileage: number): Promise<ValuationData | null> {
    return this.cacheService.getCachedValuation(vin, mileage);
  }
  
  /**
   * Store valuation in cache
   */
  async storeValuationCache(vin: string, mileage: number, valuationData: ValuationData): Promise<void> {
    return this.cacheService.storeValuationCache(vin, mileage, valuationData);
  }
  
  /**
   * Get seller valuation for VIN
   */
  async getSellerValuation(vin: string, mileage: number, gearbox: string, userId: string): Promise<ValuationData | null> {
    return this.apiService.getSellerValuation(vin, mileage, gearbox, userId);
  }
  
  /**
   * Create a car listing from valuation data
   */
  async createCarListing(valuationData: ValuationData, userId: string, vin: string, mileage: number, transmission: string): Promise<any> {
    return this.listingService.createCarListing(valuationData, userId, vin, mileage, transmission);
  }
}

// Export a singleton instance
export const valuationService = new ValuationService();
