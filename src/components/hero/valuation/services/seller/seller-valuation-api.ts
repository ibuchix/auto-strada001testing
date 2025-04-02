
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 * - 2024-11-23: Added comprehensive logging for debugging external API responses
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType } from "../../types";

/**
 * Fetch valuation data from API for seller context
 */
export async function fetchSellerValuationData(
  vin: string, 
  mileage: number, 
  gearbox: TransmissionType, 
  userId: string
): Promise<{ data?: any; error?: Error }> {
  try {
    console.log('Fetching seller valuation from API for:', { vin, mileage, gearbox, userId });
    console.time('valuation-api-call');
    
    const { data, error } = await supabase.functions.invoke(
      'handle-seller-operations',
      {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId
        }
      }
    );
    
    console.timeEnd('valuation-api-call');
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`API error: ${error.message}`);
    }
    
    // Log the complete raw response for debugging
    console.log('Raw API response:', JSON.stringify(data, null, 2));
    
    // Check response structure
    if (!data) {
      console.error('Empty response from API');
      return {
        error: new Error('Empty response from valuation API')
      };
    }
    
    if (!data.success) {
      console.error('API returned failure:', data.error);
      return {
        error: new Error(data.error || 'Failed to validate VIN')
      };
    }
    
    // Log detailed response data structure
    console.log('Success flag:', data.success);
    console.log('Response data structure:', data.data ? Object.keys(data.data) : 'No data object');
    
    // Check for valuation data
    if (data.data) {
      // Log specific valuation fields
      console.log('Valuation data preview:', {
        make: data.data.make,
        model: data.data.model,
        year: data.data.year,
        basePrice: data.data.basePrice,
        priceMin: data.data.price_min,
        priceMed: data.data.price_med,
        priceMax: data.data.price_max,
        reservePrice: data.data.reservePrice,
        valuation: data.data.valuation
      });
    }
    
    return { data: data.data || data };
  } catch (error: any) {
    console.error('Error fetching seller valuation:', error);
    return { 
      error: error instanceof Error ? error : new Error(error.message || 'Unknown error') 
    };
  }
}
