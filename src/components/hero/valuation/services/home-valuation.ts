
/**
 * Changes made:
 * - 2024-07-25: Extracted home valuation from valuationService.ts
 * - 2024-08-01: Added cache support to reduce API calls for identical VINs
 * - 2024-08-02: Fixed type issues when caching valuation data
 */

import { toast } from "sonner";
import { ValuationResult, TransmissionType } from "../types";
import { fetchHomeValuation } from "./api/valuation-api";
import { hasEssentialData, handleApiError } from "./utils/validation-helpers";
import { getCachedValuation, storeValuationCache } from "./api/cache-api";

/**
 * Process valuation for the home page context
 */
export async function processHomeValuation(
  vin: string,
  mileage: number,
  gearbox: string
): Promise<ValuationResult> {
  console.log('Processing home page valuation for VIN:', vin);
  
  try {
    // First check if we have a cached valuation
    const cachedData = await getCachedValuation(vin, mileage);
    
    if (cachedData) {
      console.log('Using cached valuation data for VIN:', vin);
      return {
        success: true,
        data: {
          ...cachedData,
          vin,
          transmission: gearbox as TransmissionType
        }
      };
    }
    
    // No cache found, proceed with API call
    console.log('No cache found, fetching valuation from API for VIN:', vin);
    const { data, error } = await fetchHomeValuation(vin, mileage, gearbox);

    if (error) {
      console.error('Valuation error:', error);
      
      if (error.message?.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      
      throw error;
    }

    console.log('Home page valuation raw response:', data);
    
    // If the API returned an error
    if (!data.success) {
      throw new Error(data.error || 'Failed to get vehicle valuation');
    }

    // Check for essential data
    if (!hasEssentialData(data?.data)) {
      console.log('No essential data found for VIN in home context');
      return {
        success: true,
        data: {
          vin,
          transmission: gearbox as TransmissionType,
          noData: true,
          error: 'No data found for this VIN'
        }
      };
    }

    // Prepare the valuation data with required fields for caching
    const valuationData = {
      make: data.data.make,
      model: data.data.model,
      year: data.data.year,
      valuation: data.data.valuation,
      averagePrice: data.data.averagePrice,
      isExisting: false,
      vin,
      transmission: gearbox as TransmissionType
    };
    
    // Store the result in cache for future use
    storeValuationCache(vin, mileage, valuationData);

    console.log('Returning complete valuation data for home context');
    return {
      success: true,
      data: valuationData
    };
  } catch (error: any) {
    return handleApiError(error, vin, gearbox as TransmissionType);
  }
}
