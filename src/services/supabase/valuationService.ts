
/**
 * Changes made:
 * - 2025-04-24: Removed caching mechanism to ensure direct API calls
 */

import { ValuationApiService, valuationApiService } from "./valuation/apiService";
import { ValuationListingService, valuationListingService } from "./valuation/listingService";
import { ValuationData } from "./valuation/valuationServiceBase";

class ValuationService {
  private apiService: ValuationApiService = valuationApiService;
  private listingService: ValuationListingService = valuationListingService;

  async getValuation(vin: string, mileage: number, gearbox: string): Promise<ValuationData | null> {
    return this.apiService.getValuation(vin, mileage, gearbox);
  }
  
  async getSellerValuation(vin: string, mileage: number, gearbox: string, userId: string): Promise<ValuationData | null> {
    return this.apiService.getSellerValuation(vin, mileage, gearbox, userId);
  }
  
  async createCarListing(valuationData: ValuationData, userId: string, vin: string, mileage: number, transmission: string): Promise<any> {
    return this.listingService.createCarListing(valuationData, userId, vin, mileage, transmission);
  }
}

export const valuationService = new ValuationService();
