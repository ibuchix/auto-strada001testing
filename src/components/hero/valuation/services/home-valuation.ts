
/**
 * Changes made:
 * - 2024-07-25: Extracted home valuation from valuationService.ts
 * - 2025-09-18: Added additional error handling and recovery mechanisms
 * - 2025-10-18: Fixed TypeScript type safety with TransmissionType
 * - 2025-10-20: Fixed reserve price calculation and display
 * - 2024-12-14: Added error resilience, fixed calculateReservePrice, and improved response handling
 * - 2025-12-22: Fixed property naming consistency and improved data handling
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
        console.log('Using cached valuation data for VIN:', vin, cachedData);
        
        // Ensure valuation/reserve price is available in cached data
        const normalizedData = { ...cachedData };
        
        if (!normalizedData.valuation && !normalizedData.reservePrice && normalizedData.basePrice) {
          const calculatedPrice = calculateReservePrice(normalizedData.basePrice);
          normalizedData.valuation = calculatedPrice;
          normalizedData.reservePrice = calculatedPrice;
          console.log('Calculated reserve price from cached base price:', calculatedPrice);
        } else if (normalizedData.valuation && !normalizedData.reservePrice) {
          normalizedData.reservePrice = normalizedData.valuation;
        } else if (!normalizedData.valuation && normalizedData.reservePrice) {
          normalizedData.valuation = normalizedData.reservePrice;
        }
        
        return {
          success: true,
          data: {
            ...normalizedData,
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
    
    // First try the direct get-vehicle-valuation edge function
    try {
      const { data: directData, error: directError } = await supabase.functions.invoke('get-vehicle-valuation', {
        body: { 
          vin, 
          mileage, 
          gearbox 
        },
        headers: {
          'X-Request-Timeout': '15000' // 15 second timeout on the edge function side
        }
      });
      
      const endTime = Date.now();
      console.log(`Direct API response time: ${endTime - startTime}ms`);
      
      if (!directError && directData?.success) {
        console.log('Direct valuation API response:', directData);
        
        // Prepare the response with normalized fields
        const responseData = { 
          ...directData.data,
          vin, 
          transmission: gearbox 
        };
        
        // Ensure reservePrice is set for consistent property access
        if (!responseData.reservePrice && responseData.valuation) {
          responseData.reservePrice = responseData.valuation;
        } else if (!responseData.valuation && responseData.reservePrice) {
          responseData.valuation = responseData.reservePrice;
        }
        
        // Store in cache for future use
        try {
          await storeValuationInCache(vin, mileage, responseData);
        } catch (cacheError) {
          console.warn('Failed to cache valuation data:', cacheError);
          // Non-critical, continue with operation
        }
        
        return {
          success: true,
          data: responseData
        };
      }
      
      // If direct call failed, we'll try the fallback below
      console.log('Direct API call did not return valid data, trying fallback...');
    } catch (directError) {
      console.warn('Direct API call failed:', directError);
      // Continue with fallback approach
    }
    
    // Fallback to handle-seller-operations edge function
    const { data, error } = await supabase.functions.invoke('handle-seller-operations', {
      body: {
        operation: 'validate_vin',
        vin,
        mileage,
        gearbox,
        userId: 'anonymous' // For home page context, we use anonymous
      },
      headers: {
        'X-Request-Timeout': '15000' // 15 second timeout on the edge function side
      }
    });
    const endTime = Date.now();
    
    console.log(`Fallback API response time: ${endTime - startTime}ms`);
    console.log('Fallback API response:', data);
    
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
    
    // Ensure consistent property names
    if (!responseData.reservePrice && responseData.valuation) {
      responseData.reservePrice = responseData.valuation;
    } else if (!responseData.valuation && responseData.reservePrice) {
      responseData.valuation = responseData.reservePrice;
    }
    
    // Calculate reserve price if needed
    if (!responseData.valuation && !responseData.reservePrice) {
      // Try using basePrice
      if (responseData.basePrice || responseData.price_min) {
        // If we have basePrice, use it directly
        if (responseData.basePrice) {
          const calculatedPrice = calculateReservePrice(responseData.basePrice);
          responseData.valuation = calculatedPrice;
          responseData.reservePrice = calculatedPrice;
          console.log('Calculated valuation from basePrice:', calculatedPrice);
        } 
        // Otherwise calculate basePrice from price_min and price_med
        else if (responseData.price_min && responseData.price_med) {
          const basePrice = (parseFloat(responseData.price_min) + parseFloat(responseData.price_med)) / 2;
          responseData.basePrice = basePrice;
          const calculatedPrice = calculateReservePrice(basePrice);
          responseData.valuation = calculatedPrice;
          responseData.reservePrice = calculatedPrice;
          console.log('Calculated basePrice and valuation:', basePrice, calculatedPrice);
        }
      }
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
