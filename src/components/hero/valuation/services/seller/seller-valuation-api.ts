
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 * - 2024-11-23: Added comprehensive logging for debugging external API responses
 * - 2024-11-24: Enhanced response processing and data normalization
 * - 2024-11-24: Added fallback mechanisms for inconsistent API responses
 * - 2028-06-03: Improved error handling and data validation
 * - 2028-06-03: Added multiple fallback mechanisms for price extraction
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType } from "../../types";
import { extractPrice, calculateReservePrice } from "@/utils/priceExtractor";

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
    
    // Generate a request ID for tracing
    const requestId = `val_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const { data, error } = await supabase.functions.invoke(
      'handle-seller-operations',
      {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId,
          requestId
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
  
  console.log('Normalizing valuation data from:', actualData);
  
  // Extract basic vehicle information with fallbacks
  const result: Record<string, any> = {
    ...actualData,
    make: actualData.make || actualData.brand || 'Unknown',
    model: actualData.model || actualData.modelName || 'Unknown',
    year: actualData.year || actualData.productionYear || new Date().getFullYear(),
  };
  
  // Try to extract price information from the response
  // First try direct extraction from common fields
  const basePrice = getFirstValidValue([
    actualData.basePrice,
    actualData.price,
    actualData.price_med,
    actualData.valuation,
    actualData.averagePrice,
    // Try to extract price from deeper nested structures
    extractPrice(actualData)
  ]);
  
  const averagePrice = getFirstValidValue([
    actualData.averagePrice,
    actualData.basePrice,
    actualData.price_med,
    actualData.valuation,
    basePrice
  ]);
  
  const reservePrice = getFirstValidValue([
    actualData.reservePrice,
    actualData.valuation,
    actualData.price,
    // If we have a base price but no reserve price, calculate it
    basePrice > 0 ? calculateReservePrice(basePrice) : null
  ]);
  
  // Set the primary fields used by the UI
  result.basePrice = basePrice;
  result.averagePrice = averagePrice;
  result.reservePrice = reservePrice;
  
  // Also set valuation as an alias for reservePrice for backward compatibility
  result.valuation = reservePrice || actualData.valuation;
  
  // Copy over any additional fields that might be useful
  if (actualData.price_min) result.price_min = actualData.price_min;
  if (actualData.price_med) result.price_med = actualData.price_med;
  if (actualData.price_max) result.price_max = actualData.price_max;
  
  // Check if we have prices and need to calculate reserve price
  if ((result.basePrice > 0 || result.averagePrice > 0) && !result.reservePrice) {
    const priceToUse = result.basePrice || result.averagePrice;
    result.reservePrice = calculateReservePrice(priceToUse);
    result.valuation = result.reservePrice; // For consistency
    console.log('Calculated reserve price locally:', { 
      price: priceToUse, 
      reservePrice: result.reservePrice 
    });
  }
  
  // Validate final result
  if (!result.reservePrice || !result.valuation) {
    console.warn('Failed to determine valuation or reserve price after normalization');
    
    // Last resort: if we have any price_* fields, use their average
    if (result.price_min && result.price_med) {
      const calculatedBasePrice = (Number(result.price_min) + Number(result.price_med)) / 2;
      result.basePrice = calculatedBasePrice;
      result.reservePrice = calculateReservePrice(calculatedBasePrice);
      result.valuation = result.reservePrice;
      console.log('Last resort price calculation:', {
        price_min: result.price_min,
        price_med: result.price_med,
        calculatedBasePrice,
        reservePrice: result.reservePrice
      });
    }
  }
  
  console.log('Normalized data result:', {
    make: result.make,
    model: result.model,
    year: result.year,
    basePrice: result.basePrice,
    averagePrice: result.averagePrice,
    reservePrice: result.reservePrice,
    valuation: result.valuation
  });
  
  // Store in localStorage for debugging purposes
  try {
    localStorage.setItem('lastValuationData', JSON.stringify({
      timestamp: new Date().toISOString(),
      vin,
      normalized: {
        make: result.make,
        model: result.model,
        reservePrice: result.reservePrice,
        valuation: result.valuation
      }
    }));
  } catch (e) {
    console.warn('Failed to store debug data in localStorage:', e);
  }
  
  return result;
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
