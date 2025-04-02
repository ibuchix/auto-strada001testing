
/**
 * Changes made:
 * - 2025-05-15: Created home-valuation processor extracted from valuationService
 * - 2025-11-01: Fixed VIN validation flow with improved error handling and API integration
 * - 2024-11-21: Fixed type issues with spread operator and improved type safety
 */

import { ValuationResult, TransmissionType, ValuationData } from "../types";
import { fetchHomeValuation } from "./api/valuation-api";
import { supabase } from "@/integrations/supabase/client";

/**
 * Process valuation for home page context
 */
export async function processHomeValuation(
  vin: string,
  mileage: number,
  transmission: TransmissionType
): Promise<ValuationResult> {
  console.log('Starting home valuation process for VIN:', vin);
  
  try {
    // First check if we have this valuation in cache
    const { data: cachedValuation } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (cachedValuation?.valuation_data) {
      console.log('Using cached valuation data for VIN:', vin);
      
      // Ensure the data is in the correct format
      const valuationData: ValuationData = {
        vin,
        mileage,
        transmission,
        ...(cachedValuation.valuation_data as Record<string, any>)
      };
      
      return {
        success: true,
        data: valuationData
      };
    }
    
    // No cache hit, make the API call
    console.log('No cache hit, calling valuation API for VIN:', vin);
    const { data, error } = await fetchHomeValuation(vin, mileage, transmission);
    
    if (error) {
      console.error('Error from valuation API:', error);
      throw error;
    }
    
    if (!data) {
      console.error('No data returned from valuation API');
      throw new Error('No valuation data available for this vehicle');
    }
    
    // Ensure the response has the required fields
    const valuationData: ValuationData = {
      vin,
      mileage,
      transmission,
      // Ensure these fields exist with fallbacks
      make: data.make || 'Unknown',
      model: data.model || 'Unknown',
      year: data.year || new Date().getFullYear(),
      valuation: data.valuation || 0,
      averagePrice: data.averagePrice || data.valuation || 0,
      reservePrice: data.reservePrice || data.valuation || 0
    };
    
    // Store in cache for future use
    try {
      await supabase
        .from('vin_valuation_cache')
        .upsert({
          vin,
          mileage,
          valuation_data: valuationData
        });
      
      console.log('Valuation data cached successfully');
    } catch (cacheError) {
      console.warn('Failed to cache valuation data:', cacheError);
      // Non-critical, continue with operation
    }
    
    console.log('Home valuation completed successfully:', valuationData);
    
    return {
      success: true,
      data: valuationData
    };
  } catch (error: any) {
    console.error('Error in processHomeValuation:', error);
    
    return {
      success: false,
      data: {
        error: error.message || 'Failed to get vehicle valuation',
        vin,
        transmission,
      }
    };
  }
}
