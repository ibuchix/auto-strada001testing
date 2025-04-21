
/**
 * Enhanced valuation API with improved error handling and data extraction
 * 
 * Changes:
 * - 2025-04-17: Improved data normalization and error handling
 * - 2025-04-17: Enhanced debug logging for better troubleshooting
 * - 2025-04-17: Added robust fallback mechanisms for inconsistent API responses
 * - 2025-04-17: Updated to use standardized data models and types
 * - 2025-04-21: Fixed TypeScript errors with imports and type definitions
 * - 2025-04-21: ADDED DETAILED CONSOLE.LOGS AT EVERY PIPELINE STAGE FOR DEBUGGING VALUATION DATA FLOW
 * - 2025-04-22: FIXED DATA EXTRACTION FROM API RESPONSE
 */

import { supabase } from "@/integrations/supabase/client";
import { TransmissionType, ValuationData } from "@/utils/valuation/valuationDataTypes";
import { normalizeValuationData } from "@/utils/valuation/valuationDataNormalizer";
import { generateRequestId, createPerformanceTracker } from "./utils/debug-utils";
import { ValuationResult } from "@/hooks/valuation/types/valuationTypes";

/**
 * Fetch valuation data for home page context
 */
export async function fetchHomeValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
): Promise<{ data?: ValuationData; error?: Error }> {
  const requestId = generateRequestId();
  const perfTracker = createPerformanceTracker('home_valuation_api', requestId);
  
  console.group(`[HomeValuationAPI][${requestId}][Detailed Valuation Check]`);
  console.log('START: Home valuation fetch', { vin, mileage, gearbox, requestId, timestamp: new Date().toISOString() });
  
  try {
    perfTracker.checkpoint('api_call_start');
    
    // Add VIN validation logging before API call
    console.log(`[HomeValuationAPI][${requestId}] Validating VIN before API call:`, {
      vin,
      vinLength: vin.length,
      isValid: vin.length === 17
    });
    
    const { data, error } = await supabase.functions.invoke<any>(
      'get-vehicle-valuation',
      {
        body: { 
          vin, 
          mileage, 
          gearbox 
        }
      }
    );
    
    perfTracker.checkpoint('api_call_complete');
    
    // Detailed API response logging
    console.log('[API] Response status from edge function', { 
      hasError: !!error, 
      hasData: !!data, 
      dataKeys: data ? Object.keys(data) : null 
    });
    
    if (error) {
      console.error('[API] Error received from function:', error);
      throw new Error(`API error: ${error.message}`);
    }
    
    if (!data) {
      console.warn('[API] Empty data received from function');
      throw new Error('No valuation data returned');
    }
    
    // Log raw edge response
    console.log('[API] Full edge response payload:', JSON.stringify(data));
    
    // Examine data structure closely
    if (data.functionResponse) {
      console.log('[API] Function response detected:', {
        hasUserParams: !!data.functionResponse.userParams,
        hasValuation: !!data.functionResponse.valuation,
        hasCalcValuation: !!data.functionResponse.valuation?.calcValuation
      });
      
      if (data.functionResponse.valuation?.calcValuation) {
        console.log('[API] CalcValuation data:', data.functionResponse.valuation.calcValuation);
      }
    }
    
    // Log any price-related fields at the root level
    const priceFields = ['price', 'price_min', 'price_med', 'valuation', 'basePrice', 'reservePrice', 'averagePrice'];
    const foundPriceFields = priceFields.filter(field => data[field] !== undefined);
    
    if (foundPriceFields.length > 0) {
      console.log('[API] Found price fields at root level:', foundPriceFields.reduce((acc, field) => {
        acc[field] = data[field];
        return acc;
      }, {} as Record<string, any>));
    } else {
      console.warn('[API] No price fields found at root level');
    }
    
    // Normalize and log data step by step
    console.log('[NORMALIZER] Passing raw data to normalizeValuationData:', {
      ...data, vin, mileage, transmission: gearbox
    });
    const normalizedData = normalizeValuationData({ ...data, vin, mileage, transmission: gearbox });
    console.log('[NORMALIZER RESULT] Data after normalization:', normalizedData);

    // Sanity check: Log if using fallback price
    if (normalizedData && normalizedData.basePrice === 50000) {
      console.warn('[NORMALIZER RESULT][WARNING] Fallback value (50000) used for basePrice!');
    }

    // Final validation check
    console.log('[API] Final validation check:', {
      hasMake: !!normalizedData.make,
      hasModel: !!normalizedData.model,
      hasYear: normalizedData.year > 0,
      hasValuation: normalizedData.valuation > 0,
      hasReservePrice: normalizedData.reservePrice > 0,
      vin: normalizedData.vin
    });

    console.groupEnd();
    
    return { data: normalizedData };
  } catch (error: any) {
    console.error(`[VAL-API][ERROR] Exception in fetchHomeValuation:`, { message: error.message, stack: error.stack });
    console.groupEnd();
    return { error: error instanceof Error ? error : new Error(error.message || 'Unknown error') };
  }
}

/**
 * Fetch valuation data for seller context with user authentication
 */
export async function fetchSellerValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType,
  userId: string
): Promise<{ data?: ValuationData; error?: Error }> {
  const requestId = generateRequestId();
  const perfTracker = createPerformanceTracker('seller_valuation_api', requestId);
  
  console.group(`[SellerValuationAPI][${requestId}] Detailed seller valuation check`);
  console.log('START: Seller valuation fetch', { vin, mileage, gearbox, userId, requestId, timestamp: new Date().toISOString() });
  
  try {
    perfTracker.checkpoint('api_call_start');
    
    const { data: response, error } = await supabase.functions.invoke<any>(
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
    
    perfTracker.checkpoint('api_call_complete');
    
    console.log('[SELLER API] Edge response:', { 
      hasResponse: !!response, 
      hasError: !!error,
      responseKeys: response ? Object.keys(response) : null
    });
    
    if (error) {
      console.error('[SELLER API] Error received:', error);
      perfTracker.complete('failure', { error, message: error.message });
      throw new Error(`API error: ${error.message}`);
    }
    
    if (!response || !response.success) {
      console.error('[SELLER API] API response indicates failure:', {
        error: response?.error || 'No success response received',
        response
      });
      perfTracker.complete('failure', {
        errorType: 'api_response_failure',
        message: response?.error || 'Failed to validate vehicle'
      });
      throw new Error(response?.error || 'Failed to validate vehicle');
    }

    // Detailed response inspection
    console.log('[SELLER API] Response data structure:', {
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : null
    });
    
    if (response.data) {
      // Check for price-related fields
      const priceFields = ['price', 'price_min', 'price_med', 'valuation', 'basePrice', 'reservePrice'];
      const foundPriceFields = priceFields.filter(field => response.data[field] !== undefined);
      
      if (foundPriceFields.length > 0) {
        console.log('[SELLER API] Found price fields:', foundPriceFields.reduce((acc, field) => {
          acc[field] = response.data[field];
          return acc;
        }, {} as Record<string, any>));
      } else {
        console.warn('[SELLER API] No price fields found in response data');
      }
    }

    // NORMALIZE
    console.log('[SELLER NORMALIZER] Passing to normalizeValuationData:', { 
      ...response.data, 
      vin, 
      mileage, 
      transmission: gearbox 
    });
    const normalizedData = normalizeValuationData({ ...response.data, vin, mileage, transmission: gearbox });
    console.log('[SELLER NORMALIZER RESULT]:', normalizedData);

    if (normalizedData && normalizedData.basePrice === 50000) {
      console.warn('[SELLER NORMALIZER WARNING] Fallback value (50000) used for basePrice!');
    }

    perfTracker.complete('success', { normalizedData, receivedResult: true });
    console.groupEnd();
    
    return { data: normalizedData };
  } catch (error: any) {
    console.error(`[SellerValuationAPI][${requestId}] Exception:`, { error, message: error.message, stack: error.stack });
    perfTracker.complete('failure', { message: error.message });
    console.groupEnd();
    return { error: error instanceof Error ? error : new Error(error.message || 'Unknown error') };
  }
}

/**
 * Calculate the reserve price based on base price
 * Uses the official pricing tiers and percentages
 */
export function calculateReservePrice(basePrice: number): number {
  console.log('[RESERVE CALC] Starting calculation with basePrice:', basePrice);
  
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    console.error('[RESERVE CALC] Invalid base price:', basePrice);
    return 0;
  }
  
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Calculate and round to the nearest whole number
  const reservePrice = Math.round(basePrice - (basePrice * percentage));
  
  console.log('[RESERVE CALC] Calculation details:', {
    basePrice,
    percentageRate: (percentage * 100).toFixed(1) + '%',
    formula: `${basePrice} - (${basePrice} × ${percentage})`,
    reservePrice
  });
  
  return reservePrice;
}
