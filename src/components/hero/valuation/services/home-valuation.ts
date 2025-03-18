
/**
 * Changes made:
 * - 2024-07-25: Extracted home valuation from valuationService.ts
 */

import { toast } from "sonner";
import { ValuationResult, TransmissionType } from "../types";
import { fetchHomeValuation } from "./api/valuation-api";
import { hasEssentialData, handleApiError } from "./utils/validation-helpers";

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

    console.log('Returning complete valuation data for home context');
    return {
      success: true,
      data: {
        make: data.data.make,
        model: data.data.model,
        year: data.data.year,
        vin,
        transmission: gearbox as TransmissionType,
        valuation: data.data.valuation,
        averagePrice: data.data.averagePrice,
        isExisting: false
      }
    };
  } catch (error: any) {
    return handleApiError(error, vin, gearbox as TransmissionType);
  }
}
