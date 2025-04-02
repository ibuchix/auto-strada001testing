
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 * - 2024-11-23: Added comprehensive logging for debugging external API responses
 * - 2024-11-24: Enhanced response processing and data normalization
 * - 2024-11-24: Added fallback mechanisms for inconsistent API responses
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
    
    // Normalize the data to ensure consistent structure
    const normalizedData = normalizeValuationData(data.data || data);
    
    // Check for valuation data
    if (normalizedData) {
      // Log specific valuation fields
      console.log('Valuation data preview:', {
        make: normalizedData.make,
        model: normalizedData.model,
        year: normalizedData.year,
        basePrice: normalizedData.basePrice,
        priceMin: normalizedData.price_min,
        priceMed: normalizedData.price_med,
        priceMax: normalizedData.price_max,
        reservePrice: normalizedData.reservePrice,
        valuation: normalizedData.valuation
      });
    }
    
    return { data: normalizedData || data };
  } catch (error: any) {
    console.error('Error fetching seller valuation:', error);
    return { 
      error: error instanceof Error ? error : new Error(error.message || 'Unknown error') 
    };
  }
}

/**
 * Normalize valuation data to ensure consistent structure
 */
function normalizeValuationData(data: any): any {
  if (!data) return null;
  
  // Handle nested data structure
  const actualData = data.data || data;
  
  // Extract key properties with fallbacks
  const result = {
    ...actualData,
    make: actualData.make || 'Unknown',
    model: actualData.model || 'Unknown',
    year: actualData.year || actualData.productionYear || new Date().getFullYear(),
    basePrice: getFirstValidValue([
      actualData.basePrice,
      actualData.price,
      actualData.price_med,
      actualData.valuation,
      actualData.averagePrice
    ]),
    averagePrice: getFirstValidValue([
      actualData.averagePrice,
      actualData.basePrice,
      actualData.price_med,
      actualData.valuation
    ]),
    reservePrice: getFirstValidValue([
      actualData.reservePrice,
      actualData.valuation,
      actualData.price
    ]),
    valuation: getFirstValidValue([
      actualData.valuation,
      actualData.reservePrice,
      actualData.price,
      actualData.price_med
    ])
  };
  
  // Copy over any additional fields that might be useful
  if (actualData.price_min) result.price_min = actualData.price_min;
  if (actualData.price_med) result.price_med = actualData.price_med;
  if (actualData.price_max) result.price_max = actualData.price_max;
  
  // Check if we have prices and need to calculate reserve price
  if ((result.basePrice > 0 || result.averagePrice > 0) && !result.reservePrice) {
    const basePrice = result.basePrice || result.averagePrice;
    result.reservePrice = calculateReservePrice(basePrice);
    result.valuation = result.reservePrice; // For consistency
    console.log('Calculated reserve price locally:', { basePrice, reservePrice: result.reservePrice });
  }
  
  return result;
}

/**
 * Calculate reserve price based on base price
 */
function calculateReservePrice(basePrice: number): number {
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) percentage = 0.65;
  else if (basePrice <= 20000) percentage = 0.46;
  else if (basePrice <= 30000) percentage = 0.37;
  else if (basePrice <= 50000) percentage = 0.27;
  else if (basePrice <= 60000) percentage = 0.27;
  else if (basePrice <= 70000) percentage = 0.22;
  else if (basePrice <= 80000) percentage = 0.23;
  else if (basePrice <= 100000) percentage = 0.24;
  else if (basePrice <= 130000) percentage = 0.20;
  else if (basePrice <= 160000) percentage = 0.185;
  else if (basePrice <= 200000) percentage = 0.22;
  else if (basePrice <= 250000) percentage = 0.17;
  else if (basePrice <= 300000) percentage = 0.18;
  else if (basePrice <= 400000) percentage = 0.18;
  else if (basePrice <= 500000) percentage = 0.16;
  else percentage = 0.145;
  
  // Calculate and round to the nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}

/**
 * Get the first valid value from an array of potential values
 */
function getFirstValidValue(values: any[]): number {
  for (const val of values) {
    if (typeof val === 'number' && val > 0) {
      return val;
    } else if (typeof val === 'string' && !isNaN(Number(val))) {
      const num = Number(val);
      if (num > 0) return num;
    }
  }
  return 0;
}
