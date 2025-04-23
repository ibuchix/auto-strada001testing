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
 * - 2025-04-23: Updated to use consolidated price utilities
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType } from "../../types";
import { extractPrice, calculateReservePrice } from "@/utils/priceUtils";

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
    
    // Enhanced logging for debugging the response structure
    console.log('Raw API response structure:', {
      success: data?.success,
      hasData: !!data?.data,
      dataKeys: data?.data ? Object.keys(data.data) : [],
      hasPrices: !!(data?.data?.reservePrice || data?.data?.basePrice),
      hasNestedFunctionResponse: !!data?.data?.functionResponse,
      timestamp: new Date().toISOString()
    });
    
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
  const actualData = data.data || data;
  
  console.log('Normalizing valuation data for VIN:', vinNumber);

  // Extract functionResponse data which contains the nested API response structure
  const functionResponse = actualData.functionResponse || {};
  const userParams = functionResponse.userParams || {};
  const calcValuation = functionResponse.valuation?.calcValuation || {};
  
  // Extract basic vehicle information with fallbacks
  const result: Record<string, any> = {
    ...actualData,
    make: userParams.make || actualData.make || 'Unknown',
    model: userParams.model || actualData.model || 'Unknown',
    year: userParams.year || actualData.year || actualData.productionYear || new Date().getFullYear(),
    vin: vinNumber, // Always ensure VIN is present
    transmission: actualData.transmission || actualData.gearbox || 'manual'
  };
  
  // Check for direct reservePrice and basePrice (preferred source)
  let basePrice = actualData.basePrice;
  let reservePrice = actualData.reservePrice;
  let averagePrice = actualData.averagePrice;
  
  // Log the direct extraction
  console.log('Direct price extraction:', {
    directBasePrice: basePrice,
    directReservePrice: reservePrice,
    directAveragePrice: averagePrice
  });
  
  // If direct values not available, extract from nested structure
  if (!basePrice || basePrice <= 0) {
    if (calcValuation.price_min > 0 && calcValuation.price_med > 0) {
      basePrice = (Number(calcValuation.price_min) + Number(calcValuation.price_med)) / 2;
      console.log('Calculated base price from calcValuation:', basePrice);
    } else if (actualData.price_min > 0 && actualData.price_med > 0) {
      basePrice = (Number(actualData.price_min) + Number(actualData.price_med)) / 2;
      console.log('Calculated base price from root level:', basePrice);
    }
  }
  
  // If still no basePrice, try other possible fields
  if (!basePrice || basePrice <= 0) {
    basePrice = actualData.valuation || 
                actualData.price || 
                calcValuation.price ||
                0;
    console.log('Used fallback for base price:', basePrice);
  }
  
  // If direct reservePrice not available but we have basePrice, calculate it
  if ((!reservePrice || reservePrice <= 0) && basePrice > 0) {
    reservePrice = calculateReservePrice(basePrice);
    console.log('Calculated reserve price from base price:', reservePrice);
  }
  
  // Set averagePrice if not already set
  if (!averagePrice || averagePrice <= 0) {
    averagePrice = actualData.price_med || 
                   calcValuation.price_med || 
                   basePrice || 
                   0;
    console.log('Used fallback for average price:', averagePrice);
  }
  
  // Assign the extracted values
  result.basePrice = basePrice;
  result.reservePrice = reservePrice;
  result.averagePrice = averagePrice;
  result.valuation = basePrice; // For backward compatibility
  
  // Copy over any price_* fields that exist
  if (calcValuation.price_min) result.price_min = calcValuation.price_min;
  else if (actualData.price_min) result.price_min = actualData.price_min;
  
  if (calcValuation.price_med) result.price_med = calcValuation.price_med;
  else if (actualData.price_med) result.price_med = actualData.price_med;
  
  if (calcValuation.price_max) result.price_max = calcValuation.price_max;
  else if (actualData.price_max) result.price_max = actualData.price_max;
  
  // Log final result
  console.log('Final normalized valuation:', {
    make: result.make,
    model: result.model,
    year: result.year,
    basePrice: result.basePrice,
    reservePrice: result.reservePrice,
    averagePrice: result.averagePrice
  });
  
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
