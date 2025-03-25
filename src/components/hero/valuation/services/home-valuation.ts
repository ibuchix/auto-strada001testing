/**
 * Changes made:
 * - 2024-07-25: Extracted home valuation from valuationService.ts
 * - 2025-09-18: Added additional error handling and recovery mechanisms
 * - 2025-10-18: Fixed TypeScript type safety with TransmissionType
 * - 2025-10-20: Fixed reserve price calculation and display
 * - 2024-12-14: Added error resilience, fixed calculateReservePrice, and improved response handling
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationResult, TransmissionType } from "../types";
import { getCachedValuation, storeValuationInCache } from "./api/cache-api";

/**
 * Calculate reserve price based on the pricing tiers
 * Implemented exactly according to the business requirements
 */
function calculateReservePrice(basePrice: number): number {
  let percentage = 0;
  
  // Determine percentage based on base price tiers
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
    percentage = 0.145; // 500,001+ PLN
  }
  
  // Calculate reserve price using the formula: basePrice - (basePrice * percentage)
  return Math.round(basePrice - (basePrice * percentage));
}

/**
 * Process valuation for the home page context
 */
export async function processHomeValuation(
  vin: string,
  mileage: number,
  gearbox: TransmissionType
): Promise<ValuationResult> {
  console.log('Processing home page valuation for VIN:', vin);
  
  try {
    // Try to get cached valuation first for performance
    try {
      const cachedData = await getCachedValuation(vin, mileage);
      if (cachedData) {
        console.log('Using cached valuation data for VIN:', vin);
        
        // Ensure valuation/reserve price is available in cached data
        if (!cachedData.valuation && cachedData.basePrice) {
          cachedData.valuation = calculateReservePrice(cachedData.basePrice);
          console.log('Calculated reserve price from cached base price:', cachedData.valuation);
        }
        
        return {
          success: true,
          data: {
            ...cachedData,
            reservePrice: cachedData.valuation, // Ensure reservePrice is set
            vin,
            transmission: gearbox
          }
        };
      }
    } catch (cacheError) {
      console.warn('Cache error, continuing with API call:', cacheError);
      // Continue with API call - don't let cache errors block the flow
    }
    
    // Get valuation from API
    console.log('Calling valuation API for VIN:', vin);
    
    const startTime = Date.now();
    const { data, error } = await supabase.functions.invoke('handle-seller-operations', {
      body: {
        operation: 'validate_vin',
        vin,
        mileage,
        gearbox,
        userId: 'anonymous' // For home page context, we use anonymous
      },
      headers: {
        'X-Request-Timeout': '10000' // 10 second timeout on the edge function side
      }
    });
    const endTime = Date.now();
    
    console.log(`API response time: ${endTime - startTime}ms`);
    console.log('Raw API response:', data);
    
    if (error) {
      console.error('Valuation API error:', error);
      throw error;
    }
    
    if (!data.success) {
      console.error('Validation failed:', data.data?.error);
      return {
        success: false,
        data: {
          error: data.data?.error || 'Failed to validate VIN',
          vin,
          transmission: gearbox
        }
      };
    }
    
    // Successfully retrieved valuation data
    console.log('Valuation data successfully retrieved:', data.data);
    
    // Prepare the response with normalized fields
    const responseData = { ...data.data, vin, transmission: gearbox };
    
    // Calculate reserve price if needed
    if (!responseData.valuation) {
      // First try using reservePrice if available
      if (responseData.reservePrice) {
        responseData.valuation = responseData.reservePrice;
        console.log('Using reservePrice as valuation:', responseData.valuation);
      } 
      // Then try using basePrice
      else if (responseData.basePrice || responseData.price_min) {
        // If we have basePrice, use it directly
        if (responseData.basePrice) {
          responseData.valuation = calculateReservePrice(responseData.basePrice);
          console.log('Calculated valuation from basePrice:', responseData.valuation);
        } 
        // Otherwise calculate basePrice from price_min and price_med
        else if (responseData.price_min && responseData.price_med) {
          const basePrice = (parseFloat(responseData.price_min) + parseFloat(responseData.price_med)) / 2;
          responseData.basePrice = basePrice;
          responseData.valuation = calculateReservePrice(basePrice);
          console.log('Calculated basePrice and valuation:', responseData.basePrice, responseData.valuation);
        }
      }
    }
    
    // Ensure reservePrice is set for consistent property access
    if (!responseData.reservePrice && responseData.valuation) {
      responseData.reservePrice = responseData.valuation;
    }
    
    // Log the final response data
    console.log('Final valuation result with reserve price:', {
      valuation: responseData.valuation,
      reservePrice: responseData.reservePrice,
      basePrice: responseData.basePrice
    });
    
    // Store in cache for future use
    try {
      if (!data.data?.isExisting) {
        await storeValuationInCache(vin, mileage, responseData);
      }
    } catch (cacheError) {
      console.warn('Failed to cache valuation data:', cacheError);
      // Non-critical, continue with operation
    }
    
    return {
      success: true,
      data: responseData
    };
    
  } catch (error: any) {
    console.error('Home valuation processing error:', error);
    
    // Check if this is a timeout or network error
    const isTimeoutError = error.message?.includes('timeout') || 
                          error.message?.includes('network') ||
                          error.code === 'ECONNABORTED' ||
                          error.code === 'ETIMEDOUT';
    
    return {
      success: false,
      data: {
        error: isTimeoutError 
          ? 'Connection timed out. Please try again later.' 
          : error.message || 'Failed to get valuation',
        vin,
        transmission: gearbox
      }
    };
  }
}
