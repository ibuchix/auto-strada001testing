
/**
 * Changes made:
 * - 2024-11-21: Extracted from seller-valuation.ts as part of refactoring
 * - 2024-11-23: Added comprehensive logging for debugging external API responses
 * - 2024-11-24: Enhanced response processing and data normalization
 * - 2024-11-24: Added fallback mechanisms for inconsistent API responses
 * - 2028-06-03: Improved error handling and data validation
 * - 2028-06-03: Added multiple fallback mechanisms for price extraction
 * - 2028-06-10: Fixed TypeScript error with undefined vin variable in normalizeValuationData
 * - 2028-06-12: Enhanced logging throughout valuation pipeline and improved fallbacks
 * - 2028-06-12: Added stronger data validation and normalization for API responses
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
    
    // Log request parameters for debugging
    console.log('Valuation request details:', {
      requestId,
      vin,
      mileage,
      gearbox,
      timestamp: new Date().toISOString()
    });
    
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
    console.log('Response data path analysis:', {
      hasDataProperty: !!data.data,
      hasDirectProperties: !!(data.make || data.model || data.year),
      dataType: typeof data.data,
      topLevelKeys: Object.keys(data)
    });
    
    // Normalize the data to ensure consistent structure
    const normalizedData = normalizeValuationData(data.data || data, vin);
    
    // Enhanced validation of normalized data
    if (normalizedData) {
      validateValuationData(normalizedData);
      
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
 * @param data The data to normalize
 * @param vinNumber The VIN associated with this valuation
 */
function normalizeValuationData(data: any, vinNumber: string): any {
  if (!data) return null;
  
  // Handle nested data structure - try multiple possible paths
  const actualData = data.data || data.functionResponse?.data || data;
  
  console.log('Normalizing valuation data from:', actualData);
  console.log('Data structure before normalization:', {
    topLevelKeys: Object.keys(actualData),
    hasVehicleInfo: !!(actualData.make && actualData.model),
    hasPriceData: !!(actualData.basePrice || actualData.price || actualData.valuation || 
                    actualData.price_min || actualData.price_med || actualData.averagePrice)
  });
  
  // Extract basic vehicle information with fallbacks
  const result: Record<string, any> = {
    ...actualData,
    make: actualData.make || actualData.brand || actualData.manufacturer || 'Unknown',
    model: actualData.model || actualData.modelName || actualData.vehicle_model || 'Unknown',
    year: actualData.year || actualData.productionYear || actualData.vehicle_year || new Date().getFullYear(),
    vin: vinNumber, // Always ensure VIN is present
    transmission: actualData.transmission || actualData.gearbox || 'manual'
  };
  
  // Try to extract price information from the response using multiple pathways
  // First try direct extraction from common fields
  const basePrice = getFirstValidValue([
    actualData.basePrice,
    actualData.price,
    actualData.price_med,
    actualData.valuation,
    actualData.averagePrice,
    // Deeper nested paths
    actualData.functionResponse?.price,
    actualData.functionResponse?.valuation?.price,
    actualData.apiResponse?.price_med,
    // Try to extract price from deeper nested structures
    extractPrice(actualData)
  ]);
  
  const averagePrice = getFirstValidValue([
    actualData.averagePrice,
    actualData.basePrice,
    actualData.price_med,
    actualData.valuation,
    actualData.price,
    basePrice
  ]);
  
  const reservePrice = getFirstValidValue([
    actualData.reservePrice,
    actualData.valuation,
    actualData.price,
    actualData.functionResponse?.reservePrice,
    // If we have a base price but no reserve price, calculate it
    basePrice > 0 ? calculateReservePrice(basePrice) : null
  ]);
  
  // Log detailed price extraction attempts
  console.log('Price extraction paths:', {
    directBasePrice: actualData.basePrice,
    directPrice: actualData.price,
    priceMed: actualData.price_med,
    directValuation: actualData.valuation,
    directAveragePrice: actualData.averagePrice,
    nestedFunctionPrice: actualData.functionResponse?.price,
    extractedPrice: extractPrice(actualData),
    finalBasePrice: basePrice,
    finalAveragePrice: averagePrice,
    finalReservePrice: reservePrice
  });
  
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
    
    // Absolute last resort: generate a placeholder valuation
    if (!result.reservePrice || result.reservePrice <= 0) {
      // This should almost never happen, but we want to avoid UI errors
      const placeholderValue = 25000; // Arbitrary placeholder
      result.reservePrice = placeholderValue;
      result.valuation = placeholderValue;
      result.isPlaceholder = true; // Flag that this is a placeholder value
      
      console.warn('Using placeholder valuation as last resort:', placeholderValue);
    }
  }
  
  console.log('Normalized data result:', {
    make: result.make,
    model: result.model,
    year: result.year,
    basePrice: result.basePrice,
    averagePrice: result.averagePrice,
    reservePrice: result.reservePrice,
    valuation: result.valuation,
    isPlaceholder: result.isPlaceholder || false
  });
  
  // Store in localStorage for debugging purposes
  try {
    localStorage.setItem('lastValuationData', JSON.stringify({
      timestamp: new Date().toISOString(),
      vin: vinNumber,
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

/**
 * Validate valuation data for completeness and log warnings for issues
 */
function validateValuationData(data: any): void {
  // Essential car info
  if (!data.make || data.make === 'Unknown') {
    console.warn('Valuation missing vehicle make');
  }
  
  if (!data.model || data.model === 'Unknown') {
    console.warn('Valuation missing vehicle model');
  }
  
  if (!data.year) {
    console.warn('Valuation missing vehicle year');
  }
  
  // Price data
  if (!data.valuation && !data.reservePrice) {
    console.warn('Valuation missing both valuation and reservePrice');
  }
  
  if (!data.basePrice && !data.averagePrice) {
    console.warn('Valuation missing both basePrice and averagePrice');
  }
  
  // Check for placeholder values
  if (data.isPlaceholder) {
    console.warn('Using placeholder valuation data - potential data quality issue');
  }
}

